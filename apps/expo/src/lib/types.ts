export interface AuthenticatedUser {
    id: string;
    name: string;
    email: string;
    image: string;
    locale: string;
    zoneinfo: string;
}
export type SignInPayload = {
    payload: {
        id: string;
        name: string;
        email: string;
        image: string;
        locale: string;
        zoneinfo: string;
    }
    access_token: string;
    refresh_token: string;
}

export type Theme = {
    primary: string
    primaryAdmin: string
    onPrimary: string
    primaryContainer: string
    onPrimaryContainer: string
    secondary: string
    onSecondary: string
    secondaryContainer: string
    onSecondaryContainer: string
    tertiary: string
    onTertiary: string
    tertiaryContainer: string
    onTertiaryContainer: string
    error: string
    onError: string
    errorContainer: string
    onErrorContainer: string
    background: string
    onBackground: string
    surface: string
    onSurface: string
    surfaceVariant: string
    onSurfaceVariant: string
    outline: string
    outlineVariant: string
    shadow: string
    scrim: string
    inverseSurface: string
    inverseOnSurface: string
    inversePrimary: string
    elevation: {
        level0: string
        level1: string
        level2: string
        level3: string
        level4: string
        level5: string
    }
    surfaceDisabled: string
    onSurfaceDisabled: string
    backdrop: string,
    text: string,
    inverseText: string,
    primaryButton: string,
}