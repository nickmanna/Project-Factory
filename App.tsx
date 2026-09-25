/**
 * Project Factory - native shell
 *
 * The actual dashboard UI (project map, git history) is a separate Vite
 * React app in dashboard/, rendered here via a WebView. See
 * docs/Project_Factory_Dashboard_UI.md for why.
 *
 * @format
 */

import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

// TODO: production builds need the dashboard's built output bundled into
// the app and loaded via a file:// URL - not implemented yet, since there's
// no release build of the dashboard to ship until the UI itself exists.
// See docs/Project_Factory_Dashboard_UI.md "Production loading" section.
const DASHBOARD_DEV_URL = 'http://localhost:5173';

function App() {
  if (__DEV__) {
    return (
      <View style={styles.container}>
        <WebView source={{uri: DASHBOARD_DEV_URL}} style={styles.webview} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>
        Production dashboard bundling isn't wired up yet - run in
        development to see the UI (dashboard/: npm run dev).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  placeholder: {
    margin: 20,
  },
});

export default App;
