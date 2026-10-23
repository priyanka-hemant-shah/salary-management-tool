/**
 * Vitest global test setup.
 * Runs before every test file.
 */
import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

// Mock window.matchMedia for Ant Design responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock ResizeObserver for Ant Design components (Select, Dropdown, Table)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock window.scrollTo and scrollIntoView
window.scrollTo = () => {}
window.HTMLElement.prototype.scrollIntoView = () => {}

// Mock getComputedStyle for pseudo-elements (Ant Design table scrollbar check)
const originalGetComputedStyle = window.getComputedStyle
window.getComputedStyle = (elt, pseudoElt) => {
  if (pseudoElt) {
    return {
      getPropertyValue: () => '',
      width: '0px',
      height: '0px',
    } as any
  }
  return originalGetComputedStyle(elt)
}

// Mock @ant-design/charts for JSDOM
vi.mock('@ant-design/charts', () => ({
  Pie: (props: { data?: unknown[] }) =>
    React.createElement('div', {
      'data-testid': 'mock-pie-chart',
      'data-count': props.data?.length || 0,
    }),
  Line: (props: { data?: unknown[] }) =>
    React.createElement('div', {
      'data-testid': 'mock-line-chart',
      'data-count': props.data?.length || 0,
    }),
  Column: (props: { data?: unknown[] }) =>
    React.createElement('div', {
      'data-testid': 'mock-column-chart',
      'data-count': props.data?.length || 0,
    }),
  Bar: (props: { data?: unknown[] }) =>
    React.createElement('div', {
      'data-testid': 'mock-bar-chart',
      'data-count': props.data?.length || 0,
    }),
}))
