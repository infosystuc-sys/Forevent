import { Image } from "expo-image";
import { Stack, useGlobalSearchParams } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "~/utils/api";

const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

SplashScreen.preventAutoHideAsync();

export default function Post() {
  const { id } = useGlobalSearchParams();
  if (!id || typeof id !== "string") throw new Error("unreachable");
  const { data, isSuccess } = api.mobile.test.byId.useQuery({ id: parseInt(id) });

  // useEffect(() => {
  //   // Perform some sort of async data or asset fetching.
  //   setTimeout(() => {
  //     // When all loading is setup, unmount the splash screen component.
  //     SplashScreen.hideAsync();
  //   }, 1000);
  // }, []);

  if (isSuccess) {
    SplashScreen.hideAsync();
  }

  if (!data) return null;

  return (
    <SafeAreaView className="bg-orange-950">
      <Stack.Screen options={{ title: data.name }} />
      <View className="h-full w-full p-4">
        <Image
          style={styles.image}
          placeholder={blurhash}
          contentFit="cover"
          transition={1000}
          source={data.image}
        />
        <Text className="py-2 text-3xl font-bold text-white">{data.species}</Text>
        <Text className="py-4 text-white">{data.gender}</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0553',
  },
});