// Temporary diagnostic wrapper: run auto-translate.mjs and surface any
// module-level rejection / uncaught exception that plain `node script.mjs`
// swallows (exit 1, zero output).
process.on('unhandledRejection', (e) => {
  console.error('UNHANDLED_REJECTION:', e && e.stack ? e.stack : e);
  process.exit(9);
});
process.on('uncaughtException', (e) => {
  console.error('UNCAUGHT_EXCEPTION:', e && e.stack ? e.stack : e);
  process.exit(9);
});
try {
  await import('./auto-translate.mjs');
} catch (e) {
  console.error('IMPORT_THREW:', e && e.stack ? e.stack : e);
  process.exit(8);
}
