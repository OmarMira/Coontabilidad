/**
 * AccountExpress Prompt Verification System
 * Verifica el cumplimiento de los 12 prompts del sistema
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class PromptVerifier {
  constructor() {
    this.prompts = [];
    this.results = {
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
    };
  }

  loadPrompts() {
    const csvPath = path.join(__dirname, '../data/accountexpress_prompts.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').slice(1); // Skip header

    this.prompts = lines
      .filter(line => line.trim())
      .map(line => {
        const [prompt, phase, category, requirements, checklist, status, priority, dependencies] = 
          line.split(',').map(s => s.trim());
        
        const checklistItems = checklist.split('|').map(item => ({
          text: item.trim(),
          checked: item.includes('☑'),
        }));

        return {
          prompt: parseInt(prompt),
          phase: parseInt(phase),
          category,
          requirements,
          checklist: checklistItems,
          status,
          priority,
          dependencies,
          completionRate: this.calculateCompletion(checklistItems),
        };
      });
  }

  calculateCompletion(items) {
    const total = items.length;
    const checked = items.filter(item => item.checked).length;
    return total > 0 ? (checked / total) * 100 : 0;
  }

  verifyPrompt(promptNumber) {
    const prompt = this.prompts.find(p => p.prompt === promptNumber);
    if (!prompt) {
      console.log(`${colors.red}✗ Prompt ${promptNumber} no encontrado${colors.reset}`);
      return false;
    }

    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}PROMPT ${prompt.prompt}: ${prompt.category}${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`Fase: ${prompt.phase} | Prioridad: ${prompt.priority} | Estado: ${prompt.status}`);
    console.log(`Completitud: ${prompt.completionRate.toFixed(1)}%`);
    console.log(`\nRequisitos: ${prompt.requirements}`);
    console.log(`\n${colors.yellow}Checklist de Verificación:${colors.reset}`);

    prompt.checklist.forEach((item, index) => {
      const icon = item.checked ? `${colors.green}☑${colors.reset}` : `${colors.red}☐${colors.reset}`;
      console.log(`  ${icon} ${item.text}`);
    });

    return prompt.completionRate === 100;
  }

  verifyAll() {
    console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║  ACCOUNTEXPRESS - VERIFICACIÓN DE PROMPTS COMPLETA   ║${colors.reset}`);
    console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════╝${colors.reset}\n`);

    this.prompts.forEach(prompt => {
      const isComplete = prompt.completionRate === 100;
      const icon = isComplete ? `${colors.green}✓${colors.reset}` : `${colors.yellow}⚠${colors.reset}`;
      const statusColor = isComplete ? colors.green : colors.yellow;
      
      console.log(
        `${icon} Prompt ${prompt.prompt.toString().padStart(2, '0')} | ` +
        `${statusColor}${prompt.completionRate.toFixed(0).padStart(3, ' ')}%${colors.reset} | ` +
        `${prompt.category}`
      );

      if (isComplete) this.results.completed++;
      else if (prompt.status === 'Pending') this.results.pending++;
      else this.results.failed++;
    });

    this.results.total = this.prompts.length;

    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}RESUMEN GENERAL${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`Total de Prompts: ${this.results.total}`);
    console.log(`${colors.green}✓ Completados: ${this.results.completed}${colors.reset}`);
    console.log(`${colors.yellow}⚠ Pendientes: ${this.results.pending}${colors.reset}`);
    console.log(`${colors.red}✗ Fallidos: ${this.results.failed}${colors.reset}`);
    
    const overallCompletion = this.prompts.reduce((sum, p) => sum + p.completionRate, 0) / this.results.total;
    console.log(`\n${colors.cyan}Completitud General: ${overallCompletion.toFixed(1)}%${colors.reset}`);

    return overallCompletion;
  }

  generateReport() {
    const reportPath = path.join(__dirname, '../../../PROMPT_VERIFICATION_REPORT.md');
    let report = '# 📋 ACCOUNTEXPRESS - REPORTE DE VERIFICACIÓN DE PROMPTS\n\n';
    report += `**Fecha:** ${new Date().toLocaleString('es-ES')}\n\n`;
    report += `## 📊 Resumen General\n\n`;
    report += `- **Total de Prompts:** ${this.results.total}\n`;
    report += `- **✅ Completados:** ${this.results.completed}\n`;
    report += `- **⚠️ Pendientes:** ${this.results.pending}\n`;
    report += `- **❌ Fallidos:** ${this.results.failed}\n\n`;

    const overallCompletion = this.prompts.reduce((sum, p) => sum + p.completionRate, 0) / this.results.total;
    report += `### Completitud General: ${overallCompletion.toFixed(1)}%\n\n`;
    report += `---\n\n`;

    this.prompts.forEach(prompt => {
      const statusEmoji = prompt.completionRate === 100 ? '✅' : 
                         prompt.completionRate > 50 ? '⚠️' : '❌';
      
      report += `## ${statusEmoji} Prompt ${prompt.prompt}: ${prompt.category}\n\n`;
      report += `- **Fase:** ${prompt.phase}\n`;
      report += `- **Prioridad:** ${prompt.priority}\n`;
      report += `- **Estado:** ${prompt.status}\n`;
      report += `- **Completitud:** ${prompt.completionRate.toFixed(1)}%\n`;
      report += `- **Dependencias:** ${prompt.dependencies}\n\n`;
      report += `### Requisitos\n${prompt.requirements}\n\n`;
      report += `### Checklist de Verificación\n\n`;
      
      prompt.checklist.forEach(item => {
        const checkbox = item.checked ? '☑' : '☐';
        report += `${checkbox} ${item.text}\n`;
      });
      
      report += `\n---\n\n`;
    });

    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`\n${colors.green}✓ Reporte generado: ${reportPath}${colors.reset}`);
  }
}

// Ejecución
const verifier = new PromptVerifier();
verifier.loadPrompts();

const args = process.argv.slice(2);
if (args.length > 0 && args[0] === '--prompt') {
  const promptNumber = parseInt(args[1]);
  verifier.verifyPrompt(promptNumber);
} else {
  verifier.verifyAll();
  verifier.generateReport();
}
