import AsyncStorage from "@react-native-async-storage/async-storage"

export const removeStoreData = async (key: string) => {
    try {
        return await AsyncStorage.removeItem(key)
    } catch (e) {
        console.log(e, "error al remover AsyncStorage")
        return undefined
    }
}

export async function storeString(key: string, value: string) {
    try {
        await AsyncStorage.setItem(key, value)
    } catch (e) {
        // saving error
    }
}

export async function storeObject(key: string, value: object) {
    try {
        const jsonValue = JSON.stringify(value)
        await AsyncStorage.setItem(key, jsonValue)
    } catch (e) {
        console.log(e, "ERROR AL GUARDAR ASYNC STORAGE")
    }
}

export async function getString(key: string) {
    try {
        const value = await AsyncStorage.getItem(key)
        // console.log(value, "GET STRING")
        if (value !== null) {
            return value
        }
    } catch (e) {
        console.log(e, "GET STRING ERROR", key)
    }
}

export async function getObject(key: string) {
    try {
        const value = await AsyncStorage.getItem(key)
        // console.log(value, "GET OBJECT")
        if (value) {
            return JSON.parse(value)
        }
    } catch (e) {
        console.log(e, "GET OBJECT ERROR")
    }
}