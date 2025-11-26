import { VietnameseFontTest } from "@/components/vietnamese-font-test";
import { VietnameseUITest } from "@/components/vietnamese-ui-test";

export default function FontTestPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Vietnamese Font Rendering Test</h1>
        <p className="text-muted-foreground mb-6">
          Comprehensive testing of Vietnamese diacritical marks and UI elements
        </p>
      </div>
      
      <VietnameseFontTest />
      <VietnameseUITest />
      
      <div className="p-6 border rounded-lg bg-green-50 dark:bg-green-950">
        <h2 className="text-xl font-bold mb-2 text-green-800 dark:text-green-200">
          Test Instructions
        </h2>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• Check that all Vietnamese diacritical marks render clearly without overlap</li>
          <li>• Verify that text remains readable at different sizes</li>
          <li>• Ensure proper spacing and alignment in UI elements</li>
          <li>• Test form inputs with Vietnamese text</li>
          <li>• Validate monospace font rendering in code blocks</li>
        </ul>
      </div>
    </div>
  );
}