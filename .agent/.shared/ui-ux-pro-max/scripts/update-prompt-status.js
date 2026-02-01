/**
 * Script interactivo para actualizar el estado de los prompts
 * Uso: node update-prompt-status.js --prompt 1 --item 5 --check
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class PromptUpdater {
  constructor() {
    this.csvPath = path.join(__dirname, '../data/accountexpress_prompts.csv');
  }

  loadCSV() {
    return fs.readFileSync(this.csvPath, 'utf-8');
  }

  saveCSV(content) {
    fs.writeFileSync(this.csvPath, content, 'utf-8');
  }

  updateItem(promptNumber, itemIndex, checked) {
    const content = this.loadCSV();
    const lines = content.split('\n');
    
    // Find the prompt line (skip header)
    let promptLineIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith(`${promptNumber},`)) {
        promptLineIndex = i;
        break;
      }
    }

    if (promptLineIndex === -1) {
      console.log(`${colors.red}✗ Prompt ${promptNumber} no encontrado${colors.reset}`);
      return false;
    }

    const parts = lines[promptLineIndex].split(',');
    if (parts.length < 5) {
      console.log(`${colors.red}✗ Formato de línea inválido${colors.reset}`);
      return false;
    }

    // Get checklist (index 4)
    const checklist = parts[4];
    const items = checklist.split('|');

    if (itemIndex < 0 || itemIndex >= items.length) {
      console.log(`${colors.red}✗ Índice de item inválido. Rango: 0-${items.length - 1}${colors.reset}`);
      return false;
    }

    // Update the item
    const oldItem = items[itemIndex];
    const newItem = checked ? oldItem.replace('☐', '☑') : oldItem.replace('☑', '☐');
    items[itemIndex] = newItem;

    // Rebuild the line
    parts[4] = items.join('|');
    lines[promptLineIndex] = parts.join(',');

    // Save
    this.saveCSV(lines.join('\n'));

    console.log(`${colors.green}✓ Actualizado:${colors.reset}`);
    console.log(`  Prompt: ${promptNumber}`);
    console.log(`  Item ${itemIndex}: ${newItem.includes('☑') ? '☑ Completado' : '☐ Pendiente'}`);
    console.log(`  ${newItem.replace('☐', '').replace('☑', '').trim()}`);

    return true;
  }

  updateAllItems(promptNumber, checked) {
    const content = this.loadCSV();
    const lines = content.split('\n');
    
    let promptLineIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].startsWith(`${promptNumber},`)) {
        promptLineIndex = i;
        break;
      }
    }

    if (promptLineIndex === -1) {
      console.log(`${colors.red}✗ Prompt ${promptNumber} no encontrado${colors.reset}`);
      return false;
    }

    const parts = lines[promptLineIndex].split(',');
    const checklist = parts[4];
    const items = checklist.split('|');

    // Update all items
    const updatedItems = items.map(item => 
      checked ? item.replace('☐', '☑') : item.replace('☑', '☐')
    );

    parts[4] = updatedItems.join('|');
    
    // Update status if all checked
    if (checked) {
      parts[5] = 'Completed';
    } else {
      parts[5] = 'Pending';
    }

    lines[promptLineIndex] = parts.join(',');
    this.saveCSV(lines.join('\n'));

    console.log(`${colors.green}✓ Todos los items del Prompt ${promptNumber} actualizados${colors.reset}`);
    console.log(`  Estado: ${checked ? 'Completado' : 'Pendiente'}`);
    console.log(`  Total de items: ${items.length}`);

    return true;
  }

  listItems(promptNumber) {
    const content = this.loadCSV();
    const lines = content.split('\n');
    
    let promptLine = null;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].startsWith(`${promptNumber},`)) {
        promptLine = lines[i];
        break;
      }
    }

    if (!promptLine) {
      console.log(`${colors.red}✗ Prompt ${promptNumber} no encontrado${colors.reset}`);
      return;
    }

    const parts = promptLine.split(',');
    const checklist = parts[4];
    const items = checklist.split('|');

    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}PROMPT ${promptNumber}: ${parts[2]}${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

    items.forEach((item, index) => {
      const icon = item.includes('☑') ? `${colors.green}☑${colors.reset}` : `${colors.yellow}☐${colors.reset}`;
      const text = item.replace('☐', '').replace('☑', '').trim();
      console.log(`[${index}] ${icon} ${text}`);
    });

    const completed = items.filter(i => i.includes('☑')).length;
    const total = items.length;
    const percentage = ((completed / total) * 100).toFixed(1);

    console.log(`\n${colors.cyan}Completitud: ${percentage}% (${completed}/${total})${colors.reset}\n`);
  }
}

// Parse arguments
const args = process.argv.slice(2);
const updater = new PromptUpdater();

if (args.length === 0) {
  console.log(`${colors.yellow}Uso:${colors.reset}`);
  console.log(`  ${colors.cyan}Listar items:${colors.reset}`);
  console.log(`    node update-prompt-status.js --prompt 1 --list`);
  console.log(`  ${colors.cyan}Marcar item como completado:${colors.reset}`);
  console.log(`    node update-prompt-status.js --prompt 1 --item 5 --check`);
  console.log(`  ${colors.cyan}Marcar item como pendiente:${colors.reset}`);
  console.log(`    node update-prompt-status.js --prompt 1 --item 5 --uncheck`);
  console.log(`  ${colors.cyan}Marcar todos los items:${colors.reset}`);
  console.log(`    node update-prompt-status.js --prompt 1 --all --check`);
  process.exit(0);
}

let promptNumber = null;
let itemIndex = null;
let action = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--prompt') {
    promptNumber = parseInt(args[i + 1]);
  } else if (args[i] === '--item') {
    itemIndex = parseInt(args[i + 1]);
  } else if (args[i] === '--check') {
    action = 'check';
  } else if (args[i] === '--uncheck') {
    action = 'uncheck';
  } else if (args[i] === '--list') {
    action = 'list';
  } else if (args[i] === '--all') {
    action = 'all';
  }
}

if (!promptNumber) {
  console.log(`${colors.red}✗ Debes especificar un número de prompt con --prompt${colors.reset}`);
  process.exit(1);
}

if (action === 'list') {
  updater.listItems(promptNumber);
} else if (action === 'all') {
  const checked = args.includes('--check');
  updater.updateAllItems(promptNumber, checked);
} else if (itemIndex !== null && action) {
  const checked = action === 'check';
  updater.updateItem(promptNumber, itemIndex, checked);
} else {
  console.log(`${colors.red}✗ Acción inválida. Usa --list, --check, --uncheck, o --all${colors.reset}`);
  process.exit(1);
}
