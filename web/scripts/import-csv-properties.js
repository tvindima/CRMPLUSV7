const fs = require('fs');
const path = require('path');

// Map angariador names to agent_id
const AGENT_MAP = {
  'Marisa Barosa': 10,
  'Nélson Neto': 8,
  'Tiago Vindima': 16,
  'Nuno Faria': 1,
  'Pedro Olaio': 2,
  'João Olaio': 3,
  'Fábio Passos': 4,
  'António Silva': 5,
  'Hugo Belo': 6,
  'Bruno Libânio': 7,
  'João Paiva': 9,
  'Eduardo Coelho': 11,
  'João Silva': 12,
  'Hugo Mota': 13,
  'João Pereira': 14,
  'João Carvalho': 15,
  'Mickael Soares': 17,
  'Paulo Rodrigues': 18,
  'Maria Rosa': 19,
  'Sofia Garcia': 20,
  'Ricardo Vila': 21,
  'António Barosa': 22,
  'Maria Mendes': 23,
};

// Parse CSV line (handling semicolon separator)
function parseCsvLine(line) {
  return line.split(';').map(field => field.trim());
}

// Convert price string to number
function parsePrice(priceStr) {
  if (!priceStr || priceStr === '') return null;
  return parseFloat(priceStr.replace(',', '.'));
}

// Map CSV row to Property object
function mapProperty(row, index) {
  const [
    referencia,
    negocio,
    tipo,
    tipologia,
    preco,
    quartos,
    estado,
    concelho,
    freguesia,
    area_util,
    area_terreno,
    ce,
    angariador,
    data_criacao
  ] = row;

  // Extract initials from reference (MB, TV, NN, etc)
  const initials = referencia.match(/^([A-Z]{2})/)?.[1];
  const INITIALS_TO_AGENT = {
    'MB': 10, // Marisa Barosa
    'NN': 8,  // Nélson Neto
    'TV': 16, // Tiago Vindima
    'NF': 1,  // Nuno Faria
    'PO': 2,  // Pedro Olaio
    'JO': 3,  // João Olaio
    'FP': 4,  // Fábio Passos
    'AS': 5,  // António Silva
    'HB': 6,  // Hugo Belo
    'BL': 7,  // Bruno Libânio
    'JP': 9,  // João Paiva
    'EC': 11, // Eduardo Coelho
    'JS': 12, // João Silva
    'HM': 13, // Hugo Mota
    'JR': 14, // João Rodrigues
    'JC': 15, // João Carvalho
    'MS': 17, // Mickael Soares
    'PR': 18, // Paulo Rodrigues
  };
  
  // Priority: reference initials > angariador name
  const agent_id = INITIALS_TO_AGENT[initials] || AGENT_MAP[angariador] || null;
  const price = parsePrice(preco);
  const usable_area = parseFloat(area_util) || null;
  const area = parseFloat(area_terreno) || usable_area;
  const bedrooms = parseInt(quartos) || 0;

  return {
    id: index + 1,
    title: `${tipo} ${tipologia || ''} ${concelho}`.trim(),
    reference: referencia,
    price: price,
    usable_area: usable_area,
    area: area,
    location: freguesia ? `${concelho}, ${freguesia}` : concelho,
    municipality: concelho,
    parish: freguesia || null,
    status: 'available',
    typology: tipologia || null,
    property_type: tipo,
    business_type: negocio,
    condition: estado || null,
    bedrooms: bedrooms,
    bathrooms: bedrooms > 0 ? Math.max(1, Math.floor(bedrooms / 2)) : 1,
    parking_spaces: bedrooms >= 2 ? 1 : 0,
    energy_certificate: ce || null,
    description: `${tipo} ${tipologia || ''} em ${concelho}. ${negocio}.`,
    observations: angariador ? `Angariador: ${angariador}` : null,
    images: [`/placeholders/${referencia}.jpg`],
    agent_id: agent_id,
  };
}

// Read and process CSV
const csvPath = path.join(__dirname, '../../../backend/scripts/propriedades.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

// Skip header
const dataLines = lines.slice(1);

// Parse all properties
const properties = dataLines.map((line, index) => {
  const row = parseCsvLine(line);
  return mapProperty(row, index);
});

// Generate TypeScript file
const tsContent = `// Auto-generated from CSV - ${new Date().toISOString()}
// Total properties: ${properties.length}

export const mockProperties = ${JSON.stringify(properties, null, 2)};
`;

// Write to mocks file
const outputPath = path.join(__dirname, '../src/mocks/properties.ts');
fs.writeFileSync(outputPath, tsContent, 'utf-8');

console.log(`✅ Imported ${properties.length} properties from CSV`);
console.log(`📊 Properties per agent:`);

// Count by agent
const countByAgent = properties.reduce((acc, p) => {
  const key = p.agent_id || 'No Agent';
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

Object.entries(countByAgent)
  .sort((a, b) => b[1] - a[1])
  .forEach(([agent, count]) => {
    const agentName = Object.entries(AGENT_MAP).find(([_, id]) => id == agent)?.[0] || agent;
    console.log(`  ${agentName}: ${count} properties`);
  });
