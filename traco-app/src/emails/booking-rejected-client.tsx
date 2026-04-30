import {
  Body,
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
  studioName: string;
  scheduledFormatted: string;
  procedureName: string;
  reason: string | null;
  bookingUrl: string;
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
const body = { padding: '32px 28px' };
const greeting = {
  color: '#0A0A0A',
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '22px',
  fontWeight: 500,
  margin: '0 0 12px',
};
const paragraph = {
  color: '#3A3A3A',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 16px',
};
const recap = {
  backgroundColor: '#FAF7F1',
  border: '1px solid #E8E5DF',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '12px 0 20px',
};
const reasonBox = {
  backgroundColor: '#FFF7E6',
  border: '1px solid #F0D9A8',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '12px 0 24px',
};
const label = {
  color: '#7A7A7A',
  fontSize: '10px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  margin: 0,
};
const value = {
  color: '#3A3A3A',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 6px',
};
const ctaContainer = { margin: '20px 0 8px', textAlign: 'center' as const };
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
const footer = {
  borderTop: '1px solid #E8E5DF',
  padding: '20px 28px',
  textAlign: 'center' as const,
};
const footerText = { color: '#7A7A7A', fontSize: '12px', margin: 0 };

export default function BookingRejectedClientEmail({
  clientName,
  designerName,
  studioName,
  scheduledFormatted,
  procedureName,
  reason,
  bookingUrl,
}: Props) {
  const firstName = clientName.split(' ')[0] || clientName;
  return (
    <Html>
      <Head />
      <Preview>Sua solicitação não pôde ser atendida</Preview>
      <Body style={main}>
        <Container style={card}>
          <Section style={header}>
            <Heading as="h1" style={logoText}>
              Traço
            </Heading>
            <Text style={subLogo}>Atualização do agendamento</Text>
            <Hr style={goldRule} />
          </Section>
          <Section style={body}>
            <Heading as="h2" style={greeting}>
              Olá, {firstName}
            </Heading>
            <Text style={paragraph}>
              Infelizmente {designerName} não pôde confirmar seu agendamento solicitado para{' '}
              <strong>{scheduledFormatted}</strong>.
            </Text>
            <Section style={recap}>
              <Text style={label}>Studio</Text>
              <Text style={value}>{studioName}</Text>
              <Text style={label}>Procedimento</Text>
              <Text style={value}>{procedureName}</Text>
            </Section>
            {reason ? (
              <Section style={reasonBox}>
                <Text style={label}>Mensagem da designer</Text>
                <Text style={{ ...value, margin: 0 }}>{reason}</Text>
              </Section>
            ) : null}
            <Text style={paragraph}>
              Você pode escolher outra data clicando abaixo. {designerName} adoraria te receber.
            </Text>
            <Section style={ctaContainer}>
              <a href={bookingUrl} style={cta}>
                Ver outros horários
              </a>
            </Section>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>Traço · Master Brow Lamination</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
