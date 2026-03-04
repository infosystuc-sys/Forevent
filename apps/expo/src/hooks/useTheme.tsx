import { useColorScheme } from 'react-native'
import { DarkTheme, LightTheme } from '~/lib/palettes'

const useTheme = () => {
    const theme = useColorScheme()

    const colors = DarkTheme

    return { colors, currentTheme: theme }
}

export default useTheme