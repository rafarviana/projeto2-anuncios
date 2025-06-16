function carregarAnuncios(dados) {
  const container = document.getElementById('anuncios-container');
  container.innerHTML = '';
  dados.forEach((anuncio) => {
    const div = document.createElement('div');
    div.className = 'anuncio';
    div.innerHTML = `
      <img src="\${anuncio.Foto}" alt="Imagem do anúncio" />
      <h3>\${anuncio.Nome}</h3>
      <p>\${anuncio.Apresentacao}</p>
      <p><strong>Endereço:</strong> \${anuncio.Endereco}</p>
      <p><a href="\${anuncio.WhatsApp}" target="_blank">WhatsApp</a></p>
    `;
    container.appendChild(div);
  });
}

function lerExcel(arquivo) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);
    carregarAnuncios(json);
  };
  reader.readAsArrayBuffer(arquivo);
}

// carregar planilha ao abrir a página
fetch('planilha.xlsx')
  .then(response => response.blob())
  .then(blob => lerExcel(blob));