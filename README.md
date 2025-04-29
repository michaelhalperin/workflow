# Visual Workflow Builder

A powerful, interactive workflow builder application built with React, TypeScript, and Tailwind CSS. This tool allows users to create, edit, and visualize workflows with a drag-and-drop interface.

## Features

- Interactive canvas for workflow building
- Drag and drop nodes
- Connect nodes with customizable connections
- Different node types (task, decision, start, end)
- Customizable connection styles (straight, curved, stepped)
- Pan and zoom navigation
- Import/export workflows as JSON
- Persistent storage using localStorage

## Tech Stack

- React 18 with TypeScript
- Tailwind CSS for styling
- SVG for connections and interactive elements
- Custom hooks for state management
- LocalStorage for data persistence
- Vite for fast development

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:3000.

## Project Structure

```
src/
├── components/            # UI Components
│   ├── ui/                # Reusable UI components (Button, Modal, etc.)
│   └── workflow/          # Workflow-specific components
├── hooks/                 # Custom React hooks
│   └── workflow/          # Workflow-specific hooks
├── types/                 # TypeScript type definitions
├── App.tsx                # Main app component
└── main.tsx               # Entry point
```

## How to Use

1. **Add Nodes**: Double-click on the canvas or use the "Add Node" button
2. **Move Nodes**: Drag nodes to position them on the canvas
3. **Connect Nodes**: Drag from the connection handle (+ icon) to another node
4. **Edit Nodes/Connections**: Click on a node or connection to select and edit it
5. **Delete Elements**: Use the delete button or press Delete key when selected
6. **Pan Canvas**: Drag the background to move the view
7. **Zoom**: Use mouse wheel or the zoom controls in the toolbar
8. **Export/Import**: Use the toolbar buttons to save or load workflows

## Build for Production

To build the app for production:

```bash
npm run build
```

The build output will be in the `dist` directory.

## Future Enhancements

- Undo/redo functionality
- Advanced node types (timers, webhooks, conditions)
- Custom node templates
- Real-time collaboration
- Backend integration for server-side storage
- Workflow execution and simulation
- Mobile support with touch interactions

## License

MIT 