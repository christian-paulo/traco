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
  pdfUrl?: string;
  designerName: string;
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

const checkBadge = {
  backgroundColor: 'rgba(201,169,97,0.12)',
  borderRadius: '999px',
  color: '#C9A961',
  display: 'inline-block',
  fontSize: '24px',
  height: '56px',
  lineHeight: '56px',
  margin: '0 auto 16px',
  textAlign: 'center' as const,
  width: '56px',
};

const greeting = {
  color: '#0A0A0A',
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '24px',
  fontWeight: 500,
  margin: '0 0 12px',
  textAlign: 'center' as const,
};

const paragraph = {
  color: '#3A3A3A',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 16px',
};

const ctaContainer = {
  margin: '24px 0 8px',
  textAlign: 'center' as const,
};

const cta = {
  backgroundColor: '#0A0A0A',
  color: '#FFFFFF',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 500,
  letterSpacing: '0.1em',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
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

export default function AnamnesisCompletedClientEmail({
  clientName,
  pdfUrl,
  designerName,
}: Props) {
  const firstName = clientName.split(' ')[0] || clientName;
  return (
    <Html>
      <Head />
      <Preview>Sua ficha foi recebida ✓</Preview>
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
            <div style={{ textAlign: 'center' }}>
              <Text style={checkBadge}>✓</Text>
            </div>
            <Heading as="h2" style={greeting}>
              Sua ficha foi recebida
            </Heading>
            <Text style={paragraph}>
              Obrigada, <strong>{firstName}</strong>! Recebemos sua ficha de anamnese assinada.
            </Text>
            <Text style={paragraph}>
              {designerName} já está com tudo preparado para o seu atendimento.
            </Text>
            {pdfUrl ? (
              <Section style={ctaContainer}>
                <Button href={pdfUrl} style={cta}>
                  Baixar minha ficha (PDF)
                </Button>
              </Section>
            ) : null}
            <Text style={paragraph}>Te vejo em breve! ✨</Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>Traço · Master Brow Lamination</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
