import {
    Body,
    Button,
    Container,
    Head,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Tailwind,
    Text
} from '@react-email/components';

const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : '';

export const EmployeeCreatedEmailTemplate = ({
    username,
    name,
    guildName,
    link
}: { username: string, name: string, guildName: string, link: string }) => {
    const previewText = `Te han creado una cuenta en Forevent`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
                        <Section className="mt-[32px]">
                        </Section>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hola {name},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            La organización <strong>{guildName}</strong> te ha creado una cuenta en{' '}
                            <strong>Forevent</strong>.
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Puedes iniciar sesión con tu nombre de usuario <strong>{username}</strong>{' '} o tu correo electronico.
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Tu contraseña es tu <strong>número de documento de identidad</strong>
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Por motivos de seguridad deberas cambiar tu contraseña la primera vez que inicies sesión.
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#000000] p-2 rounded text-white text-[12px] font-semibold no-underline text-center"
                                href={link}
                            >
                                Inicia sesión
                            </Button>
                        </Section>
                        <Text className="text-black text-[14px] leading-[24px]">
                            o copia y pega esta URL en tu navegador:{' '}
                            <Link
                                href={link}
                                className="text-blue-600 no-underline"
                            >
                                {link}
                            </Link>
                        </Text>
                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                        <Text className="text-[#666666] text-[12px] leading-[24px]">
                            Esta correo fue enviada a{' '}
                            <span className="text-black">{name} </span>. Si no esperabas este correo, puedes ignorar este correo.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default EmployeeCreatedEmailTemplate;