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
  procedureName: string;
  performedDate: string;
  finalPrice: string;
  returnDate: string | null;
  postCareNotes: string[];
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

const recap = {
  backgroundColor: '#FAF7F1',
  border: '1px solid #E8E5DF',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '12px 0 24px',
};

const recapLine = {
  color: '#3A3A3A',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 0 4px',
};

const recapLabel = {
  color: '#7A7A7A',
  fontSize: '10px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  margin: 0,
};

const careTitle = {
  color: '#C9A961',
  fontSize: '11px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  margin: '24px 0 8px',
};

const careItem = {
  color: '#3A3A3A',
  fontSize: '14px',
  lineHeight: '21px',
  margin: '0 0 6px',
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

export default function PostAttendanceEmail({
  clientName,
  designerName,
  procedureName,
  performedDate,
  finalPrice,
  returnDate,
  postCareNotes,
}: Props) {
  const firstName = clientName.split(' ')[0] || clientName;
  return (
    <Html>
      <Head />
      <Preview>Obrigada pela visita ao Traço — cuidados pós-procedimento</Preview>
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
              Obrigada pela visita, {firstName} ✨
            </Heading>
            <Text style={paragraph}>
              Foi um prazer cuidar de você hoje. Aqui está o resumo do nosso encontro:
            </Text>

            <Section style={recap}>
              <Text style={recapLabel}>Procedimento</Text>
              <Text style={recapLine}>{procedureName}</Text>
              <Text style={recapLabel}>Data</Text>
              <Text style={recapLine}>{performedDate}</Text>
              <Text style={recapLabel}>Valor</Text>
              <Text style={recapLine}>{finalPrice}</Text>
              {returnDate ? (
                <>
                  <Text style={recapLabel}>Próximo retorno</Text>
                  <Text style={recapLine}>
                    {returnDate} · vou te avisar quando chegar perto.
                  </Text>
                </>
              ) : null}
            </Section>

            <Text style={careTitle}>Cuidados pós-procedimento</Text>
            {postCareNotes.map((note, idx) => (
              <Text key={idx} style={careItem}>
                • {note}
              </Text>
            ))}

            <Text style={paragraph}>
              Qualquer dúvida ou desconforto, me chama no WhatsApp 💛
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              Com carinho, {designerName} · Traço · Master Brow Lamination
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
