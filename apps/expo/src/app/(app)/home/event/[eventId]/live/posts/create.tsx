import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomSheet, {
  BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, CameraCapturedPicture, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, FormProvider, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import TextInput from '~/components/input';
import { useSession } from '~/context/auth';
import useTheme from '~/hooks/useTheme';
import { api } from '~/utils/api';

const postSchema = z.object({
  url: z.string().url({ message: "URL inválida" }),
  about: z.string().optional()
})

export default function App() {
  const { colors } = useTheme()
  let cameraRef = useRef<Camera>(null);
  const [type, setType] = useState(CameraType.back);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(false);
  const [photo, setPhoto] = useState<CameraCapturedPicture | null>(null);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const utils = api.useUtils()
  const session = useSession()
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const postForm = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      url: "",
      about: undefined,
    },
    mode: "onBlur"
  })

  const createPost = api.mobile.post.create.useMutation({
    onSuccess: async (res) => {
      console.log(res, "success")
      utils.mobile.post.all.invalidate()
      router.back()
    },
    onError: (error) => {
      console.log(error, "error")
    }
  })

  const uploadImage = api.mobile.upload.create.useMutation({
    onSuccess: async (res) => {
      console.log(res, "jesus")

      const formData = new FormData()

      Object.entries(res.fields).forEach(([key, value]) => {
        formData.append(key, value! as any)
      })

      if (photo) {
        formData.append('file', photo as any)

        const uploadResponse = await fetch(res.url, {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          postForm.setValue("url", "https://d2l7xb0l2x2ws7.cloudfront.net/" + res.fields.key)
          console.log("https://d2l7xb0l2x2ws7.cloudfront.net/" + res.fields.key, "   URL DEL ARCHIVO")
          // alert('Upload successful!')
        } else {
          console.error('S3 Upload Error:', uploadResponse)
          // alert('Upload failed.')
        }
        handleSnapPress(1)
      } else if (image) {

        formData.append('file', image as any)

        const uploadResponse = await fetch(res.url, {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          postForm.setValue("url", "https://d2l7xb0l2x2ws7.cloudfront.net/" + res.fields.key)
          console.log("https://d2l7xb0l2x2ws7.cloudfront.net/" + res.fields.key, "   URL DEL ARCHIVO")
          // alert('Upload successful!')
        } else {
          console.error('S3 Upload Error:', uploadResponse)
          // alert('Upload failed.')
        }
        handleSnapPress(1)
      }

    },
    onError: (error) => {
      console.log(error, "error")
    }
  })

  let takePicture = async () => {
    let options = {
      quality: 1,
      base64: true,
      exif: false
    };

    let newPhoto = await cameraRef.current?.takePictureAsync(options);

    if (newPhoto) {

      setPhoto(newPhoto);
      uploadImage.mutate({ contentType: "image/jpeg", filename: newPhoto.uri ?? Math.random().toString(36).substring(7) })
      postForm.setValue("url", newPhoto?.uri as string)
      handleSnapPress(1)
    }
  };

  const onError: SubmitErrorHandler<z.infer<typeof postSchema>> = (
    errors,
    e
  ) => {
    console.log("on error")
    console.log(JSON.stringify(errors));
  };

  const onSubmit: SubmitHandler<z.infer<typeof postSchema>> = (data) => {
    console.log("on submit")
    console.log(JSON.stringify(data));
    createPost.mutate({ ...data, eventId: eventId! as string, userId: session.user?.id! as string })

  };

  let flipCamera = async () => {
    setType(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      selectionLimit: 1,
      aspect: [4, 3],
      quality: 1,
    });

    // console.log(result, "resultado!");

    if (result.assets && result.assets[0]) {
      const file = result.assets[0]
      setImage(file)
      uploadImage.mutate({ contentType: file?.type ?? "image/jpeg", filename: file?.fileName ?? "foto" })
      postForm.setValue("url", result.assets[0].uri as string)
      handleSnapPress(1)
    }
  };

  const snapPoints = useMemo(() => ["40%"], [])

  const { bottom: safeBottomArea } = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleSnapPress = useCallback((index: any) => {
    bottomSheetRef.current?.snapToIndex(index);
  }, []);

  const handleExpandPress = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleClosePress = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const contentContainerStyle = useMemo(
    () => [
      { paddingHorizontal: 20, marginBottom: safeBottomArea || 6 },
    ],
    [safeBottomArea]
  );

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasCameraPermission(cameraPermission.status === "granted");
      setHasMediaLibraryPermission(libraryPermission.status === "granted");
    })();
  }, []);

  if (hasCameraPermission === undefined) {
    return <Text>Requesting permissions...</Text>
  } else if (!hasCameraPermission) {
    return <Text>Permission for camera not granted. Please change this in settings.</Text>
  }

  if (photo || image) {
    return (
      <SafeAreaView style={styles.container}>
        <Image style={styles.preview} source={{
          uri: postForm.watch("url")
        }} />
        <BottomSheet
          ref={bottomSheetRef}
          onClose={() => { }}
          enableDynamicSizing={true}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          animateOnMount={true}
          keyboardBlurBehavior='none'
          keyboardBehavior="interactive"
          android_keyboardInputMode='adjustResize'
          backgroundStyle={{ backgroundColor: '#000' }}
          index={1}
          handleIndicatorStyle={{ backgroundColor: '#fff' }}
        >
          <BottomSheetScrollView overScrollMode={"never"} scrollEnabled={false} style={{ paddingHorizontal: 20, gap: 5 }}>
            <Pressable onPress={() => setPhoto(null)} className=' z-10 flex flex-row items-center my-2'>
              <MaterialCommunityIcons className='m-0 p-0' name="chevron-left" size={40} color={colors.text} />
              <Text numberOfLines={2} style={{ fontWeight: "800", fontSize: 25, lineHeight: 50, letterSpacing: -1, color: colors.text }}>
                CREAR UN POST
              </Text>
            </Pressable>
            <FormProvider {...postForm}>
              <Controller
                control={postForm.control}
                name="about"
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => {
                  return (
                    <TextInput
                      bottomSheet={Platform.OS === "ios"}
                      label="Descripción"
                      placeholder="Que linda noche"
                      onBlur={onBlur}
                      value={value}
                      onChangeText={onChange}
                      errorMessage={error?.message}
                    />
                  );
                }}
              />
              <View className="mb-5" />
              <Pressable className='w-full rounded-full flex items-center justify-center h-12' style={{
                borderWidth: 1,
                borderColor: "#FFD25B",
                shadowColor: "#FFD25B",
                shadowOpacity: 0.5,
                shadowRadius: 10,
              }} onPress={postForm.handleSubmit(onSubmit, onError)}
              >
                {createPost.isPending ?
                  <ActivityIndicator color={colors.text} size='small' />
                  :
                  <Text style={{ textTransform: "uppercase" }} className="text-white text-lg font-semibold ">
                    Publicar
                  </Text>
                }
              </Pressable>
              <View className="h-20" />
            </FormProvider>
          </BottomSheetScrollView>
        </BottomSheet>
      </SafeAreaView >
    );
  }

  return (
    <Camera style={styles.container} type={type} ref={cameraRef} className=' flex-1 w-full h-full'>
      <Pressable className='rounded-full absolute top-20 left-5' onPress={() => { router.back() }}>
        <MaterialCommunityIcons name="chevron-left" size={40} color={"#fff"} />
      </Pressable>
      <View className='flex  flex-row w-full items-center justify-between px-10 pb-10 pt-5'>
        <Pressable className='rounded-full' disabled onPress={pickImage}>
          <MaterialCommunityIcons name="image-search" size={40} color={"#ffffff00"} />
        </Pressable>
        <Pressable className='rounded-full' onPress={takePicture}>
          <MaterialCommunityIcons name="circle" size={80} color={"#fff"} />
        </Pressable>
        <Pressable className='rounded-full' onPress={flipCamera}>
          <MaterialCommunityIcons name="camera-flip-outline" size={40} color={"#fff"} />
        </Pressable>
      </View>
      <StatusBar style="auto" />
    </Camera>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  buttonContainer: {
    backgroundColor: '#fff',
    alignSelf: 'center'
  },
  preview: {
    alignSelf: 'stretch',
    flex: 1
  }
});