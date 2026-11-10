import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import bold from 'react-native-pell-rich-editor/img/bold.png';
import italic from 'react-native-pell-rich-editor/img/italic.png';
import underline from 'react-native-pell-rich-editor/img/underline.png';
import strike from 'react-native-pell-rich-editor/img/strikethrough.png';
import bulletList from 'react-native-pell-rich-editor/img/ul.png';
import orderedList from 'react-native-pell-rich-editor/img/ol.png';
import alignLeft from 'react-native-pell-rich-editor/img/justify_left.png';
import alignCenter from 'react-native-pell-rich-editor/img/justify_center.png';
import alignRight from 'react-native-pell-rich-editor/img/justify_right.png';
import alignJustify from 'react-native-pell-rich-editor/img/justify_full.png';
import indent from 'react-native-pell-rich-editor/img/indent.png';
import outdent from 'react-native-pell-rich-editor/img/outdent.png';

import type { AtaFormat } from '@/components/ata/AtaEditor.types';
import { FontFamily, Typography } from '@/constants/theme';

const ICONS: Partial<Record<AtaFormat, ImageSourcePropType>> = {
  bold,
  italic,
  underline,
  strike,
  bulletList,
  orderedList,
  alignLeft,
  alignCenter,
  alignRight,
  alignJustify,
  indent,
  outdent,
};

export default function AtaFormatIcon({
  action,
  color,
}: {
  action: AtaFormat;
  color: string;
}) {
  const source = ICONS[action];
  if (source)
    return (
      <Image source={source} style={[styles.image, { tintColor: color }]} />
    );
  if (action.startsWith('heading'))
    return <Text style={[styles.heading, { color }]}>H{action.slice(-1)}</Text>;
  if (action === 'undo' || action === 'redo')
    return (
      <Ionicons
        name={action === 'undo' ? 'arrow-undo-outline' : 'arrow-redo-outline'}
        size={22}
        color={color}
      />
    );
  return (
    <View style={styles.font}>
      <Ionicons name="text-outline" size={20} color={color} />
      <Ionicons
        name={action === 'fontIncrease' ? 'add' : 'remove'}
        size={12}
        color={color}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  image: { width: 22, height: 22, resizeMode: 'contain' },
  heading: { ...Typography.bodyLarge, fontFamily: FontFamily.bold },
  font: { flexDirection: 'row', alignItems: 'flex-start' },
});
