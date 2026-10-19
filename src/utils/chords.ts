export interface ParsedChordSegment {
  chord?: string;
  text: string;
}

export interface ParsedChordLine {
  segments: ParsedChordSegment[];
  hasChords: boolean;
  plainText: string;
}

/**
 * Parses a line containing chord tags like "[G]Louvai ao [C]Senhor"
 * into structured segments for easy rendering.
 */
export function parseChordLine(line: string): ParsedChordLine {
  const segments: ParsedChordSegment[] = [];
  const regex = /\[([^\]]+)\]([^[]*)/g;
  let hasChords = false;
  let plainText = '';

  // Check if line starts with text before the first chord
  const firstBracketIndex = line.indexOf('[');
  if (firstBracketIndex > 0) {
    const prefix = line.substring(0, firstBracketIndex);
    segments.push({ text: prefix });
    plainText += prefix;
  } else if (firstBracketIndex === -1) {
    // No chords on this line at all
    return {
      segments: [{ text: line }],
      hasChords: false,
      plainText: line,
    };
  }

  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    hasChords = true;
    const chord = match[1];
    const lyric = match[2] || '';
    segments.push({ chord, text: lyric });
    plainText += lyric;
  }

  return {
    segments,
    hasChords,
    plainText,
  };
}

/**
 * Parses full chord text into lines.
 */
export function parseFullChords(rawText: string): ParsedChordLine[] {
  if (!rawText) return [];
  const lines = rawText.split('\n');
  return lines.map((l) => parseChordLine(l));
}
