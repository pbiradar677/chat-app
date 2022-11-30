import { useNavigation, useRoute } from '@react-navigation/native';
import { Avatar, Image, Input, Text, Tab, TabView, SearchBar } from '@rneui/themed';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, TouchableWithoutFeedback, Linking, Alert, FlatList } from 'react-native'
import { FontAwesome, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'
import { addDoc, db, serverTimestamp, auth, doc, collection, onSnapshot, orderBy, query, ref, uploadBytes, getStorage, getDownloadURL } from '../firebase'
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { format } from 'date-fns';
import Autolink from 'react-native-autolink';
const ChatScreen = () =>
{
    const navigation = useNavigation();
    const { params: { chatName, id, email, photoURL } } = useRoute();
    console.log(chatName, id, email, photoURL)
    const [input, setInput] = useState('')
    const [messages, setMessages] = useState([])
    const dates = new Set();

    const scrollViewRef = useRef()


    useLayoutEffect(() =>
    {
        navigation.setOptions({
            title: chatName,
            headerTitleAlign: 'left',
            headerBackTitleVisible: false,
            headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar
                        rounded
                        source={{ uri: messages[0]?.data?.photoURL }} />


                    <Text
                        style={{ color: 'white', marginLeft: 10, fontWeight: "700" }}
                    >{chatName}</Text>
                </View>
            ),
            headerRight: () => (
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',

                    width: 80,
                    marginRight: 20
                }}>

                    {/* <TouchableOpacity>
                        <FontAwesome name='video-camera' size={24} color="white" />
                    </TouchableOpacity> */}
                    {/* <TouchableOpacity onPress={pickDocument}>
                        <FontAwesome5 name='file-upload' size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickImage}>
                        <Ionicons name='attach' size={24} color="white" />
                    </TouchableOpacity> */}
                </View>
            )
        })


    }, [navigation, messages])





    // const downloadFile = async (uri, filename) =>
    // {
    //     try
    //     {
    //         let fileUri = FileSystem.documentDirectory + filename;
    //         console.log(uri,filename)
    //         let downloadPath = await FileSystem.downloadAsync(uri, fileUri)
    //         const { status } = await MediaLibrary.requestPermissionsAsync();

    //         if (status === "granted")
    //         {
    //             const asset = await MediaLibrary.createAssetAsync(downloadPath.uri);

    //             await MediaLibrary.createAlbumAsync("Download", asset, false);
    //             Alert.alert("Success", "Image was successfully downloaded!");
    //         }
    //     } catch (error)
    //     {
    //         console.log(error)
    //     }
    // }



    const pickDocument = async () =>
    {
        try
        {
            let result = await DocumentPicker.getDocumentAsync({
                // type: "application/pdf",
            });
            console.log(result)
            if (result !== null)
            {

                let type = result.mimeType.split('/')[0]
                let uri = result.uri
                let filename = uri.split("/");
                filename = filename[filename.length - 1];
                const r = await fetch(uri);
                const b = await r.blob();

                uri = uri.substring(uri.lastIndexOf('/') + 1);

                // create a file ref
                const fileRef = ref(getStorage(), uri);

                //upload image to firebase storage 
                await uploadBytes(fileRef, b,);

                //get image url
                let fileurl = await getDownloadURL(fileRef);
                //save image url as text in message field
                await sendMessage(fileurl, type, filename)
            }
        } catch (error)
        {
            console.log(error)
        }
    };

    const pickImage = async () =>
    {
        try
        {

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [5, 4],
                quality: 1,
            });

            console.log(result);

            if (!result.canceled)
            {
                let source = result?.assets[0]?.uri;
                let type = result?.assets[0]?.type || 'image';


                let filename = source.split("/");
                filename = filename[filename.length - 1];
                const response = await fetch(source);
                let blob = await response.blob();
                // remove last slash from local file path
                source = source.substring(source.lastIndexOf('/') + 1);

                // create a file ref
                const fileRef = ref(getStorage(), source);

                //upload image to firebase storage 
                await uploadBytes(fileRef, blob,);

                //get image url
                let fileurl = await getDownloadURL(fileRef);
                //save image url as text in message field
                await sendMessage(fileurl, type, filename)
            }
        } catch (error)
        {
            console.log(error)
        }
    };
    const sendMessage = async (fileurl = null, type = 'text', filename = undefined) =>
    {
        try
        {
            input && Keyboard.dismiss()

            let doc = {
                message: fileurl || input,
                type: type,

                timestamp: serverTimestamp(),
                email: auth.currentUser.email,
                username: auth.currentUser.displayName,
                photoURL: auth.currentUser.photoURL
            }
            if (filename)
            {
                doc.filename = filename
            }
            await addDoc(
                collection(
                    db,
                    "chats",
                    id,
                    "messages"
                ),
                doc
            );



        } catch (error)
        {
            console.log(error);
        } finally
        {

            input && setInput("");
        }

    };
    useLayoutEffect(() =>
    {

        const unsub = onSnapshot(
            query(
                collection(
                    db,
                    "chats",
                    id,
                    "messages"
                ),
                orderBy("timestamp")
            ),
            (snapshot) =>
            {
                setMessages(
                    snapshot.docs.map((doc) => ({
                        id: doc.id,
                        data: doc.data(),
                    }))
                );
            }
        );

        return unsub;

    }, []);

    const renderDate = (date) =>
    {


        if (date)
        {
            dates.add(date)
            return < >
                <Text style={{ color: '#ffffff', padding: 10, borderRadius: 10, backgroundColor: 'grey', alignSelf: 'center', marginVertical: 10 }}>{date}</Text>
            </>
        }
    }
    const handleText = (text) =>
    {

        setInput(text)
        // if (text.endsWith('@'))
        // {
        //     alert('metion')
        // }
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} >
            <StatusBar style='light' />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={160}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

                    <>



                        <ScrollView contentContainerStyle={{ paddingTop: 15 }}
                            ref={scrollViewRef}
                            onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}

                        >
                            {/* {chat goes here} */}
                            {messages.map(({ id, data: { message, email, photoURL, filename, username, timestamp, type } }) =>
                            {
                                let reciever = email === auth.currentUser.email ? true : false;
                                let msg;

                                let date = timestamp && format(new Date(timestamp?.toDate()), 'dd/MM/yyyy')
                                switch (type)
                                {
                                    case 'image':
                                        msg = <Image

                                            source={{ uri: message }}
                                            style={{ width: 200, height: 200, }}
                                        />

                                        break;
                                    case 'application':

                                    // msg = <View

                                    //     style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                                    // >
                                    //     <Text
                                    //         onPress={async () =>
                                    //         {
                                    //             let res = await Linking.canOpenURL(message)
                                    //             if (res)
                                    //             {
                                    //                 Linking.openURL(message)
                                    //             }
                                    //         }}
                                    //         numberOfLines={3}
                                    //         style={[styles[reciever ? 'recieverText' : 'senderText'], { width: '80%' }]}>{message}</Text>
                                    //     {/* {
                                    //         !reciever && <MaterialCommunityIcons
                                    //             onPress={() => downloadFile(message, filename)}
                                    //             name='download-circle-outline' size={30} color='white' />} */}
                                    // </View>
                                    // break;

                                    default: msg = <Autolink
                                        // Required: the text to parse for links
                                        text={message}
                                        // Optional: enable email linking
                                        email
                                        // Optional: enable hashtag linking to instagram
                                        hashtag="instagram"
                                        // Optional: enable @username linking to twitter
                                        mention="twitter"
                                        // Optional: enable phone linking
                                        phone
                                        // Optional: enable URL linking
                                        url
                                        // Optional: custom linking matchers
                                        // matchers={[MyCustomTextMatcher]}
                                        showAlert
                                        textProps={{ selectable: true }}
                                    />


                                        break;
                                }

                                return (
                                    <View key={id}>
                                        {
                                            dates.has(date) ? null : renderDate(date)
                                        }

                                        <View style={styles[reciever ? 'reciever' : 'sender']}>
                                            {/* {reciever ? <Avatar
                                            rounded

                                            //web
                                            containerStyle={{
                                                position: 'absolute',
                                                bottom: -15,
                                                right: -5,
                                            }}
                                            position='absolute'
                                            bottom={-15}
                                            right={5}


                                            source={{ uri: photoURL }}
                                        /> : <Avatar
                                            rounded
                                            onPress={openChat}
                                            //web
                                            containerStyle={{
                                                position: 'absolute',
                                                bottom: -15,
                                                left: -5,
                                            }}
                                            position='absolute'
                                            bottom={-15}
                                            left={5}
                                            source={{ uri: photoURL }}
                                        />} */}
                                            {auth.currentUser.displayName !== username && <Text style={{ color: !reciever ? 'black' : 'black', marginBottom: 2 }}>{username}</Text>}
                                            {msg}
                                            {timestamp && <Text style={{ color: !reciever ? 'black' : 'black', alignSelf: 'flex-end', paddingTop: 2, marginLeft: 5 }}>{format(new Date(timestamp?.toDate()), 'hh:mm a')}</Text>}

                                        </View>

                                    </View>



                                )
                            })}
                        </ScrollView>

                        <View style={styles.footer}>
                            <TextInput
                                placeholder='Signal Message' style={[styles.textInput, {

                                }]}

                                value={input}
                                onChangeText={text => handleText(text)}
                                onSubmitEditing={() => input && sendMessage()}

                            />
                            <TouchableOpacity onPress={pickDocument} style={{ position: 'absolute', right: input ? 160 : 130 }}>
                                <Ionicons name='attach' size={24} color="black" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={pickImage} style={{ position: 'absolute', right: input ? 120 : 90 }}>
                                <Ionicons name='images' size={24} color="black" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() =>
                            {
                                // navigation.navigate('ImageCapture', { id })
                            }} style={{ position: 'absolute', right: input ? 70 : 50 }}>
                                <Ionicons name='camera' size={24} color="black" />
                            </TouchableOpacity>
                            {input && <TouchableOpacity
                                disabled={!input}
                                activeOpacity={0.5}
                                onPress={() => sendMessage()}
                            >
                                <Ionicons name='send' size={24} color={!input ? 'grey' : '#2B68E6'} />
                            </TouchableOpacity>}
                        </View>







                    </>
                </TouchableWithoutFeedback>

            </KeyboardAvoidingView>
        </SafeAreaView >
    )
}

export default ChatScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    reciever: {
        padding: 15,
        backgroundColor: '#ECECEC',
        alignSelf: 'flex-end',
        borderRadius: 20,
        marginRight: 15,
        marginBottom: 20,
        width: '80%',
        position: 'relative'
    },
    sender: {
        padding: 15,
        backgroundColor: '#ECECEC',
        // alignSelf: 'flex-start',
        borderRadius: 20,
        margin: 15,
        width: '80%',
        position: 'relative'
    },
    senderText: {
        color: 'black',
        fontWeight: '500',
        marginLeft: 10,
        marginBottom: 15
    },
    recieverText: {
        color: 'black',
        fontWeight: '500',
        marginLeft: 10,

    },
    senderName: {
        left: 10,
        paddingRight: 10,
        fontSize: 10,
        color: 'white'
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        padding: 15
    },
    textInput: {
        bottom: 0,
        height: 40,
        flex: 1,
        marginRight: 15,

        backgroundColor: '#ECECEC',

        padding: 10,
        color: 'gray',
        borderRadius: 30
    },


})