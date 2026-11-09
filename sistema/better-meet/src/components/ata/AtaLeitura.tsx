import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function AtaLeitura({ html }: { html: string }) {
  const { colors } = useTheme();
  // HTML já sanitizado pela API. CSP e JavaScript desligado isolam a leitura.
  const document = `<!doctype html><html lang="pt-BR"><head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
    <style>body{background:${colors.backgroundElement};color:${colors.text};font-family:sans-serif;font-size:${Typography.bodyLarge.fontSize}px;line-height:1.5;padding:${Spacing.md}px;overflow-wrap:anywhere}pre{white-space:pre-wrap}</style>
    </head><body>${html}</body></html>`;
  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
      <WebView
        accessibilityLabel="Ata em modo de leitura"
        source={{ html: document }}
        originWhitelist={['*']}
        javaScriptEnabled={false}
        domStorageEnabled={false}
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        mixedContentMode="never"
        onShouldStartLoadWithRequest={({ url }) => url === 'about:blank'}
        nestedScrollEnabled
        style={styles.reader}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: Radius.md, overflow: 'hidden' },
  reader: { height: 360 },
});
