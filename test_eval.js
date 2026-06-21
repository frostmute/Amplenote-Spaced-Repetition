const html = `<body>
  <script>
    const data = ${JSON.stringify("[something]")};
    console.log(data);
  </script>
</body>`;
console.log(html);
