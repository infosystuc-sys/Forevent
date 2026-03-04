import {
    Body,
    Column,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Row,
    Section,
    Text
} from '@react-email/components';


const baseUrl = `https://d1uydgebs34vim.cloudfront.net`

export const ConfirmGuildEmailTemplate = ({
    validationCode,
}: { validationCode: string }) => (
    <Html>
        <Head />
        <Preview>Organización creada con exito</Preview>
        <Body style={main}>
            <Container style={container}>
                {/* <Section style={logoContainer}>
                    <Img
                        src={`${baseUrl}/logo.png`}
                        width="76"
                        height="70"
                        className='bg-black p-4'
                        alt="Forevent logo"
                    />
                </Section> */}
                <Heading style={h1}>Confirma el correo de tu organización</Heading>
                <Text style={heroText}>
                    Tu codigo de confimacion esta abajo, ingresalo en tu navegador y para completar el alta de tu organización.
                </Text>

                <Section style={codeBox}>
                    <Text style={confirmationCodeText}>{validationCode}</Text>
                </Section>

                <Text style={text}>
                    Si no solicitaste este correo electrónico, no te preocupes: puedes ignorarlo.
                </Text>
                <Section>
                    <Row style={footerLogos}>
                        <Column style={{ width: '66%' }}>
                            {/* <Img
                                src={`${baseUrl}/logo.png`}
                                width="76"
                                height="70"
                                className='bg-black p-4'
                                alt="Forevent logo"
                            /> */}
                        </Column>
                        {/* <Column>
                            <Row>
                                <Column>
                                    <Link href="/">
                                        <Img
                                            src={`${baseUrl}/static/slack-twitter.png`}
                                            width="32"
                                            height="32"
                                            alt="Slack"
                                            style={socialMediaIcon}
                                        />
                                    </Link>
                                </Column>
                                <Column>
                                    <Link href="/">
                                        <Img
                                            src={`${baseUrl}/static/slack-facebook.png`}
                                            width="32"
                                            height="32"
                                            alt="Slack"
                                            style={socialMediaIcon}
                                        />
                                    </Link>
                                </Column>
                                <Column>
                                    <Link href="/">
                                        <Img
                                            src={`${baseUrl}/static/slack-linkedin.png`}
                                            width="32"
                                            height="32"
                                            alt="Slack"
                                            style={socialMediaIcon}
                                        />
                                    </Link>
                                </Column>
                            </Row>
                        </Column> */}
                    </Row>
                </Section>
                {/* <Section>
                    <Link
                        style={footerLink}
                        href="https://slackhq.com"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Our blog
                    </Link>
                    &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
                    <Link
                        style={footerLink}
                        href="https://slack.com/legal"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Policies
                    </Link>
                    &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
                    <Link
                        style={footerLink}
                        href="https://slack.com/help"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Help center
                    </Link>
                    &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
                    <Link
                        style={footerLink}
                        href="https://slack.com/community"
                        target="_blank"
                        rel="noopener noreferrer"
                        data-auth="NotApplicable"
                        data-linkindex="6"
                    >
                        Slack Community
                    </Link>
                    <Text style={footerText}>
                        ©2022 Slack Technologies, LLC, a Salesforce company. <br />
                        500 Howard Street, San Francisco, CA 94105, USA <br />
                        <br />
                        All rights reserved.
                    </Text>
                </Section> */}
            </Container>
        </Body>
    </Html>
);

export default ConfirmGuildEmailTemplate;

const footerText = {
    fontSize: '12px',
    color: '#b7b7b7',
    lineHeight: '15px',
    textAlign: 'left' as const,
    marginBottom: '50px',
};

const footerLink = {
    color: '#b7b7b7',
    textDecoration: 'underline',
};

const footerLogos = {
    marginBottom: '32px',
    paddingLeft: '8px',
    paddingRight: '8px',
    width: '100%',
};

const socialMediaIcon = {
    display: 'inline',
    marginLeft: '32px',
};

const main = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
    maxWidth: '600px',
    margin: '0 auto',
};

const logoContainer = {
    marginTop: '32px',
};

const h1 = {
    color: '#1d1c1d',
    fontSize: '36px',
    fontWeight: '700',
    margin: '30px 0',
    padding: '0',
    lineHeight: '42px',
};

const heroText = {
    fontSize: '20px',
    lineHeight: '28px',
    marginBottom: '30px',
};

const codeBox = {
    background: 'rgb(245, 244, 245)',
    borderRadius: '4px',
    marginRight: '50px',
    marginBottom: '30px',
    padding: '43px 23px',
};

const confirmationCodeText = {
    fontSize: '30px',
    textAlign: 'center' as const,
    verticalAlign: 'middle',
};

const text = {
    color: '#000',
    fontSize: '14px',
    lineHeight: '24px',
};
