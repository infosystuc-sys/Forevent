import { FlashList } from "@shopify/flash-list";
import { Image } from 'expo-image';
import { Link } from "expo-router";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";

const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const EVENT_ID = "27509a61-538d-43a0-8e04-3bde0af41391"

function PostCard(props: {
  post: RouterOutputs["mobile"]["test"]["all"][number];
  onDelete: () => void;
}) {
  return (
    <View className="flex flex-row flex-1 rounded-lg  p-4">
      <View className="flex-grow">
        <Link
          asChild
          href={{
            pathname: "/(app)/post/[id]",
            params: { id: props.post.id },
          }}
        >
          <Pressable>
            <Image
              style={styles.image}
              placeholder={blurhash}
              contentFit="cover"
              transition={1000}
              source={props.post.image}
            />
            <Text className="text-xl font-semibold text-pink-400">
              {props.post.name}
            </Text>
            <Text className="mt-2 text-white">{props.post.gender}</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

export default function Index() {
  const utils = api.useUtils();

  const postQuery = api.mobile.test.all.useQuery();

  const deletePostMutation = api.mobile.test.delete.useMutation({
    onSettled: () => utils.mobile.test.all.invalidate(),
  });

  return (
    <SafeAreaView className="bg-neutral-950">
      {/* Changes page title visible on the header */}
      {/* <Stack.Screen options={{ title: "Home Page" }} /> */}
      <View className="h-full w-full p-4">
        <Text className="pb-2 text-center text-5xl font-bold text-white">
          Create <Text className="text-pink-400">T3</Text> Turbo
        </Text>
        <Button
          onPress={() => void utils.mobile.post.all.invalidate()}
          title="Refresh posts"
          color={"#f472b6"}
        />
        <View className="flex flex-row flex-wrap w-full">
          <Link asChild href={{ pathname: "/register" }}>
            <Button title="Register" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/login" }}>
            <Button title="Login" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/home/" }}>
            <Button title="Home" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/(app)/home/[category]/", params: { category: "TRENDING" } }}>
            <Button title="Category" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/home/event/" }}>
            <Button title="Event" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/home/ticket" }}>
            <Button title="Tickets" color={"#f472b6"} />
          </Link>
        </View>
        <Text className="text-white font-bold">
          Social media
        </Text>
        <View className="flex flex-row flex-wrap w-full">
          <Link asChild href={{ pathname: "/(app)/home/event/[eventId]/live/(tabs)/posts", params: { eventId: EVENT_ID } }}>
            <Button title="See Posts" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/(app)/home/event/[eventId]/live/posts/create", params: { eventId: EVENT_ID } }}>
            <Button title="Create Post" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/(app)/home/event/[eventId]/live/(tabs)/users", params: { eventId: EVENT_ID } }}>
            <Button title="See users" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/(app)/home/event/[eventId]/live/(tabs)/store", params: { eventId: EVENT_ID } }}>
            <Button title="See store" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/(app)/home/event/[eventId]/live/(tabs)/chats", params: { eventId: EVENT_ID } }}>
            <Button title="See chats" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/(app)/home/event/[eventId]/live/chats/[chatId]", params: { eventId: EVENT_ID, chatId: "iddelchat!" } }}>
            <Button title="Specific chat" color={"#f472b6"} />
          </Link>
        </View>
        <Text className="text-white font-bold">Categories</Text>
        <View className="flex flex-row flex-wrap w-full">
          <Link asChild
            href={{
              pathname: "/(app)/home/[category]/",
              params: { category: "TRENDING" }
            }}>
            <Button title="Trending" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/(app)/home/[category]/", params: { category: "TONIGHT" } }}>
            <Button title="Tonight" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/(app)/home/[category]/", params: { category: "THISWEEK" } }}>
            <Button title="Thisweek" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/(app)/home/[category]/", params: { category: "SPEED" } }}>
            <Button title="Speed" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/(app)/home/[category]/", params: { category: "PRIVATE" } }}>
            <Button title="Private" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/(app)/home/[category]/", params: { category: "CULTURAL" } }}>
            <Button title="Cultural" color={"#f472b6"} />
          </Link>
          <Link asChild href={{ pathname: "/(app)/home/[category]/", params: { category: "BAR" } }}>
            <Button title="Bar" color={"#f472b6"} />
          </Link>
        </View>
        <FlashList
          data={postQuery.data}
          estimatedItemSize={20}
          ListEmptyComponent={() => (
            <View className="py-2">
              <Text className="font-semibold italic text-white">
                No hay personajes
              </Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={(p) => {
            return (
              <PostCard
                post={p.item}
                onDelete={() => deletePostMutation.mutate(p.item.id)}
              />
            )
          }}
        />
        {/* <CreatePost /> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    flex: 1,
    width: '100%',
    height: 200,
    backgroundColor: '#0553',
  },
});