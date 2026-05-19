import React, { useMemo } from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

interface RichTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  boldStyle?: StyleProp<TextStyle>;
}

type Segment = { text: string; bold?: boolean; italic?: boolean };

function parseInline(input: string): Segment[] {
  const segments: Segment[] = [];
  const pattern = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(__([^_]+)__)|(_([^_]+)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: input.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined) segments.push({ text: match[2], bold: true });
    else if (match[4] !== undefined) segments.push({ text: match[4], italic: true });
    else if (match[6] !== undefined) segments.push({ text: match[6], bold: true });
    else if (match[8] !== undefined) segments.push({ text: match[8], italic: true });
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < input.length) segments.push({ text: input.slice(lastIndex) });
  return segments;
}

export default function RichText({ text, style, boldStyle }: RichTextProps) {
  const segments = useMemo(() => parseInline(text ?? ''), [text]);
  return (
    <Text style={style}>
      {segments.map((seg, i) => {
        if (seg.bold) {
          return (
            <Text key={i} style={[{ fontWeight: '700' }, boldStyle]}>
              {seg.text}
            </Text>
          );
        }
        if (seg.italic) {
          return (
            <Text key={i} style={{ fontStyle: 'italic' }}>
              {seg.text}
            </Text>
          );
        }
        return seg.text;
      })}
    </Text>
  );
}
