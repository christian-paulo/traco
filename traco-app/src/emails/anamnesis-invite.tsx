import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type Props = {
  clientName: string;
  designerName: string;
  formUrl: string;
};

const main = {
  backgroundColor: '#F5F1EA',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  padding: '32px 0',
};

const card = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E8E5DF',
  borderRadius: '12px',
  margin: '0 auto',
  maxWidth: '560px',
  overflow: 'hidden',
};

const header = {
  backgroundColor: '#0A0A0A',
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const logoText = {
  color: '#C9A961',
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '32px',
  fontWeight: 300,
  letterSpacing: '0.04em',
  margin: 0,
};

const subLogo = {
  color: 'rgba(255,255,255,0.7)',
  fontSize: '10px',
  letterSpacing: '0.4em',
  textTransform: 'uppercase' as const,
  marginTop: '8px',
};

const goldRule = {
  borderColor: '#C9A961',
  borderTopWidth: '1px',
  margin: '20px auto 0',
  width: '40px',
};

const body = {
  padding: '32px 28px',
};

const greeting = {
  color: '#0A0A0A',
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '24px',
  fontWeight: 500,
  margin: '0 0 12px',
};

const paragraph = {
  color: '#3A3A3A',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 16px',
};

const ctaContainer = {
  margin: '28px 0',
  textAlign: 'center' as const,
};

const cta = {
  backgroundColor: '#C9A961',
  color: '#0A0A0A',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  letterSpacing: '0.18em',
  padding: '14px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
};

const expirationNotice = {
  color: '#7A7A7A',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '16px 0 0',
};

const footer = {
  borderTop: '1px solid #E8E5DF',
  padding: '20px 28px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#7A7A7A',
  fontSize: '12px',
  margin: 0,
};

export default function AnamnesisInviteEmail({ clientName, designerName, formUrl }: Props) {
  const firstName = clientName.split(' ')[0] || clientName;
  return (
    <Html>
      <Head />
      <Preview>Sua ficha de anamnese — Traço Master Brow</Preview>
      <Body style={main}>
        <Container style={card}>
          <Section style={header}>
            <Heading as="h1" style={logoText}>
              Traço
            </Heading>
            <Text style={subLogo}>by Master Brow</Text>
            <Hr style={goldRule} />
          </Section>
          <Section style={body}>
            <Heading as="h2" style={greeting}>
              Olá, {firstName}!
            </Heading>
            <Text style={paragraph}>
              <strong>{designerName}</strong> está te aguardando! Antes do seu atendimento,
              precisamos que você preencha sua ficha de anamnese.
            </Text>
            <Text style={paragraph}>
              É rápido — leva uns 3 minutos. Tudo digital e seguro.
            </Text>
            <Section style={ctaContainer}>
              <Button href={formUrl} style={cta}>
                Preencher ficha agora
              </Button>
            </Section>
            <Text style={expirationNotice}>Este link expira em 7 dias.</Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>Traço · Master Brow Lamination</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
