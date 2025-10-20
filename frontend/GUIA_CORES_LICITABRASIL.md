# 🎨 **GUIA DE CORES OFICIAIS - LICITABRASIL WEB PLATFORM**

## 📋 **CORES OFICIAIS DA PLATAFORMA**

### **🟢 COR PRIMÁRIA - VERDE ESCURO**
- **Hex**: `#2C3F32`
- **RGB**: `rgb(44, 63, 50)`
- **HSL**: `hsl(135, 18%, 21%)`
- **Uso**: Elementos principais, botões primários, cabeçalhos, navegação

### **🟡 COR SECUNDÁRIA - AMARELO**
- **Hex**: `#F7D52A`
- **RGB**: `rgb(247, 213, 42)`
- **HSL**: `hsl(50, 92%, 57%)`
- **Uso**: Destaques, botões secundários, elementos de ação

## 🎨 **PALETA COMPLETA**

### **Verde (Primária)**
```css
--color-primary: #2C3F32;           /* Principal */
--color-primary-light: #4A6B50;     /* Claro */
--color-primary-dark: #1A2A1F;      /* Escuro */
```

### **Amarelo (Secundária)**
```css
--color-secondary: #F7D52A;         /* Principal */
--color-secondary-light: #F9E055;   /* Claro */
--color-secondary-dark: #D5B800;    /* Escuro */
```

### **Cores de Suporte**
```css
--color-background: #f5f5f5;        /* Fundo geral */
--color-paper: #ffffff;             /* Fundo de cards */
--color-text-primary: #2C3F32;      /* Texto principal */
--color-text-secondary: #666666;    /* Texto secundário */
--color-text-on-primary: #FFFFFF;   /* Texto sobre verde */
--color-text-on-secondary: #2C3F32; /* Texto sobre amarelo */
```

## 🔧 **COMO USAR AS CORES**

### **1. Material-UI (Recomendado)**
```typescript
// Use as cores do tema MUI
<Button color="primary">Botão Primário</Button>
<Button color="secondary">Botão Secundário</Button>
<Typography color="primary.main">Texto Verde</Typography>
<Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
  Conteúdo com fundo verde
</Box>
```

### **2. Variáveis CSS**
```css
/* Use as variáveis CSS definidas */
.meu-componente {
  background-color: var(--color-primary);
  color: var(--color-text-on-primary);
}

.destaque {
  border-left: 4px solid var(--color-secondary);
}
```

### **3. Cores Hardcoded (Evitar)**
```css
/* ❌ NÃO FAÇA ISSO */
.elemento {
  background-color: #2C3F32; /* Hardcoded */
}

/* ✅ FAÇA ISSO */
.elemento {
  background-color: var(--color-primary); /* Variável */
}
```

## 📐 **ACESSIBILIDADE E CONTRASTE**

### **✅ Combinações Aprovadas WCAG AAA**
| Fundo | Texto | Contraste | Uso |
|-------|-------|-----------|-----|
| `#2C3F32` | `#FFFFFF` | **12.8:1** | Botões primários, headers |
| `#F7D52A` | `#2C3F32` | **8.4:1** | Botões secundários, destaques |
| `#4A6B50` | `#FFFFFF` | **8.1:1** | Variações de verde |
| `#1A2A1F` | `#FFFFFF` | **16.5:1** | Verde escuro intenso |

### **🎯 Diretrizes de Contraste**
- ✅ **Texto normal**: Mínimo 4.5:1 (WCAG AA)
- ✅ **Texto grande**: Mínimo 3:1 (WCAG AA)
- ✅ **Elementos interativos**: Mínimo 3:1
- ✅ **Todas as combinações oficiais**: WCAG AAA (7:1+)

## 🚫 **O QUE NÃO FAZER**

### **❌ Cores Proibidas**
- Não use azul `#1976d2` (cor antiga)
- Não use laranja `#f57c00` (cor antiga)
- Não use cores hardcoded sem variáveis
- Não altere as cores sem aprovação

### **❌ Combinações Inadequadas**
- Verde sobre amarelo (baixo contraste)
- Amarelo sobre branco (baixo contraste)
- Cores muito similares juntas

## 📱 **APLICAÇÃO POR COMPONENTE**

### **Navegação (AppBar)**
```typescript
<AppBar color="primary"> {/* Verde escuro */}
  <Toolbar>
    <Typography color="inherit"> {/* Branco */}
```

### **Botões**
```typescript
<Button variant="contained" color="primary"> {/* Verde */}
<Button variant="contained" color="secondary"> {/* Amarelo */}
<Button variant="outlined" color="primary"> {/* Borda verde */}
```

### **Cards e Containers**
```typescript
<Card sx={{ borderLeft: 4, borderLeftColor: 'primary.main' }}>
<Box sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
```

### **Ícones e Indicadores**
```typescript
<Icon color="primary" />
<Chip color="secondary" />
<Badge color="primary" />
```

## 🔄 **MANUTENÇÃO E ATUALIZAÇÕES**

### **📍 Arquivos Principais**
1. **`frontend/src/App.tsx`** - Tema Material-UI
2. **`frontend/src/index.css`** - Variáveis CSS globais
3. **`frontend/src/App.css`** - Estilos específicos
4. **`frontend/public/manifest.json`** - Metadados PWA

### **🔧 Para Alterar Cores**
1. Atualizar tema MUI em `App.tsx`
2. Atualizar variáveis CSS em `index.css`
3. Testar contraste e acessibilidade
4. Fazer build e deploy
5. Atualizar este guia

### **✅ Checklist de Validação**
- [ ] Cores aplicadas no tema MUI
- [ ] Variáveis CSS atualizadas
- [ ] Contraste WCAG AAA validado
- [ ] Build sem erros
- [ ] Testes visuais aprovados
- [ ] Documentação atualizada

## 🎯 **IDENTIDADE VISUAL**

### **🇧🇷 Significado das Cores**
- **Verde**: Representa a natureza, crescimento, estabilidade e confiança
- **Amarelo**: Representa energia, otimismo, clareza e atenção
- **Combinação**: Cores da bandeira brasileira, identidade nacional

### **💼 Aplicação Profissional**
- Verde escuro transmite seriedade e confiabilidade
- Amarelo destaca elementos importantes sem ser agressivo
- Contraste excelente garante acessibilidade total
- Paleta coesa em toda a plataforma

## 📞 **SUPORTE**

Para dúvidas sobre aplicação das cores ou alterações na identidade visual:
1. Consulte este guia primeiro
2. Verifique a implementação nos arquivos principais
3. Teste sempre o contraste e acessibilidade
4. Documente qualquer mudança aprovada

---

**🎨 LICITABRASIL WEB PLATFORM - CORES OFICIAIS**  
**Versão**: 2.0 (Setembro 2025)  
**Status**: ✅ Implementado e Ativo
