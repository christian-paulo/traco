import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';

type Props = {
  clientName: string;
  designerName: string;
  criticalAnswers: Array<{ label: string; value: string }>;
  pdfUrl?: string;
  clientProfileUrl: string;
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

const heading = {
  color: '#0A0A0A',
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '22px',
  fontWeight: 500,
  margin: '0 0 8px',
};

const subhead = {
  color: '#7A7A7A',
  fontSize: '11px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  margin: '0 0 20px',
};

const sectionTitle = {
  color: '#0A0A0A',
  fontSize: '12px',
  letterSpacing: '0.18em',
  margin: '24px 0 12px',
  textTransform: 'uppercase' as const,
};

const qaLabel = {
  color: '#0A0A0A',
  fontSize: '13px',
  fontWeight: 500,
  margin: '0 0 4px',
};

const qaValue = {
  color: '#3A3A3A',
  fontSize: '14px',
  margin: '0 0 12px',
};

const ctaContainer = {
  margin: '24px 0 0',
  textAlign: 'center' as const,
};

const ctaPrimary = {
  backgroundColor: '#0A0A0A',
  color: '#FFFFFF',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 500,
  letterSpacing: '0.1em',
  padding: '12px 24px',
  borderRadius: '8px',
  textDecoration: 'none',
  margin: '4px',
};

const ctaSecondary = {
  backgroundColor: 'transparent',
  border: '1px solid #C9A961',
  color: '#C9A961',
  display: 'inline-block',
  fontSize: '13px',
  fontWeight: 500,
  letterSpacing: '0.1em',
  padding: '11px 22px',
  borderRadius: '8px',
  textDecoration: 'none',
  margin: '4px',
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

export default function AnamnesisCompletedDesignerEmail({
  clientName,
  designerName,
  criticalAnswers,
  pdfUrl,
  clientProfileUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>Nova ficha assinada — {clientName}</Preview>
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
            <Text style={subhead}>Nova ficha assinada</Text>
            <Heading as="h2" style={heading}>
              {clientName}
            </Heading>
            <Text style={{ color: '#3A3A3A', fontSize: '14px', margin: '0 0 8px' }}>
              Olá, {designerName.split(' ')[0]}! A cliente acabou de assinar a ficha de anamnese.
            </Text>

            {criticalAnswers.length > 0 ? (
              <>
                <Text style={sectionTitle}>Atenção · Respostas críticas</Text>
                {criticalAnswers.map((answer, idx) => (
                  <Row key={idx}>
                    <Text style={qaLabel}>{answer.label}</Text>
                    <Text style={qaValue}>{answer.value}</Text>
                  </Row>
                ))}
              </>
            ) : null}

            <Section style={ctaContainer}>
              {pdfUrl ? (
                <Button href={pdfUrl} style={ctaPrimary}>
                  Baixar PDF
                </Button>
              ) : null}
              <Button href={clientProfileUrl} style={ctaSecondary}>
                Ver perfil da cliente
              </Button>
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
