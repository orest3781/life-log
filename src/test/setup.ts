import '@testing-library/jest-dom/vitest'
// Provide an in-memory IndexedDB implementation for the whole test run.
import 'fake-indexeddb/auto'
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer'

// jsdom's Blob lacks arrayBuffer()/text(); Node's implementation has both, so
// our backup code (and assertions) behave like a real browser.
globalThis.Blob = NodeBlob as unknown as typeof Blob
globalThis.File = NodeFile as unknown as typeof File
