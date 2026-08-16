import { Text, View, StyleSheet } from "react-native";
import {Link} from "expo-router";
import {Stack} from "expo-router"

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={{fontSize:20, color: "red"}}>Leck meine eier</Text>
      <Link href="/login"></Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
