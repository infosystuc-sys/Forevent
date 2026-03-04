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

export const GuildInviteEmailTemplate = ({
    link,
    name,
    guildName,
}: { link: string, name: string, guildName: string }) => {
    const previewText = `Unete a ${guildName} en Forevent`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
                        <Section className="mt-[32px]">
                            {/* <Img
                  src={`${baseUrl}/static/vercel-logo.png`}
                  width="40"
                  height="37"
                  alt="Vercel"
                  className="my-0 mx-auto"
                /> */}
                        </Section>
                        {/* <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Join <strong>{teamName}</strong> on <strong>Vercel</strong>
              </Heading> */}
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hola {name},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Te han invitado a la organización <strong>{guildName}</strong> en{' '}
                            <strong>Forevent</strong>.
                        </Text>
                        {/* <Section>
                <Row>
                  <Column align="right">
                    <Img className="rounded-full" src={userImage} width="64" height="64" />
                  </Column>
                  <Column align="center">
                    <Img
                      src={`${baseUrl}/static/vercel-arrow.png`}
                      width="12"
                      height="9"
                      alt="invited you to"
                    />
                  </Column>
                  <Column align="left">
                    <Img className="rounded-full" src={teamImage} width="64" height="64" />
                  </Column>
                </Row>
              </Section> */}
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#000000] p-2 rounded text-white text-[12px] font-semibold no-underline text-center"
                                href={link}
                            >
                                Inicia sesión para unirte
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
                            Esta invitacion fue enviada a{' '}
                            <span className="text-black">{name} </span>. Si no esperabas esta invitacion, puedes ignorar este correo.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default GuildInviteEmailTemplate;