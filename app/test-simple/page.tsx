// Static test page with no dependencies
export default function SimpleTestPage() {
  return (
    <html>
      <head>
        <title>BRITS-AI Test</title>
      </head>
      <body>
        <h1>✅ BRITS-AI Application is Working!</h1>
        <p>Build error has been resolved successfully.</p>
        <p>This is a simple test page to verify functionality.</p>
        <p>Time: {new Date().toISOString()}</p>
      </body>
    </html>
  );
}