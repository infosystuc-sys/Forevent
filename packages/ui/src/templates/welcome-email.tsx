import * as React from 'react';

interface EmailTemplateProps {
    fullname: string;
    message: string;
    title: string;
    link?: { href: string, text: string }
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
    fullname,
    title,
    message,
    link
}) => (
    <div>
        {title && <h1>{title}</h1>}
        {fullname && <h2>Hola, {fullname}</h2>}
        {message && <p>{message}</p>}
        {link && <a href={link.href}>{link.text}</a>}
    </div>
);
