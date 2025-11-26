'use client';

import { useEffect, useState } from 'react';

export function VietnameseFontTest() {
    const [fontInfo, setFontInfo] = useState<string>('Loading...');
    const [actualFont, setActualFont] = useState<string>('Loading...');
    const [documentLang, setDocumentLang] = useState<string>('Loading...');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const fontStack = getComputedStyle(document.documentElement).getPropertyValue('--font-vietnamese');
            setFontInfo(fontStack);

            // Get document language
            setDocumentLang(document.documentElement.lang || 'Not set');

            // Get the actual computed font
            const testElement = document.createElement('div');
            testElement.style.fontFamily = fontStack;
            testElement.textContent = 'Test';
            document.body.appendChild(testElement);
            const computedFont = getComputedStyle(testElement).fontFamily;
            setActualFont(computedFont);
            document.body.removeChild(testElement);
        }
    }, []);

    const vietnameseTestCases = [
        {
            category: "Basic Vietnamese Text",
            text: "Xin chào! Đây là test font tiếng Việt."
        },
        {
            category: "Vowel 'a' with tones",
            text: "à á ả ã ạ"
        },
        {
            category: "Vowel 'ă' with tones",
            text: "ằ ắ ẳ ẵ ặ"
        },
        {
            category: "Vowel 'â' with tones",
            text: "ầ ấ ẩ ẫ ậ"
        },
        {
            category: "Vowel 'e' with tones",
            text: "è é ẻ ẽ ẹ"
        },
        {
            category: "Vowel 'ê' with tones",
            text: "ề ế ể ễ ệ"
        },
        {
            category: "Vowel 'i' with tones",
            text: "ì í ỉ ĩ ị"
        },
        {
            category: "Vowel 'o' with tones",
            text: "ò ó ỏ õ ọ"
        },
        {
            category: "Vowel 'ô' with tones",
            text: "ồ ố ổ ỗ ộ"
        },
        {
            category: "Vowel 'ơ' with tones",
            text: "ờ ớ ở ỡ ợ"
        },
        {
            category: "Vowel 'u' with tones",
            text: "ù ú ủ ũ ụ"
        },
        {
            category: "Vowel 'ư' with tones",
            text: "ừ ứ ử ữ ự"
        },
        {
            category: "Vowel 'y' with tones",
            text: "ỳ ý ỷ ỹ ỵ"
        },
        {
            category: "Special consonants",
            text: "đ Đ"
        },
        {
            category: "Complex words",
            text: "nghiêm trọng, xuất sắc, hoàn thành"
        },
        {
            category: "Long sentence",
            text: "Tôi đang học tiếng Việt với những dấu thanh phức tạp và các ký tự đặc biệt."
        },
        {
            category: "Mixed case",
            text: "Việt Nam, VIỆT NAM, việt nam, VIệT nAM"
        }
    ];

    const textSizes = [
        { label: "Small (12px)", className: "text-xs" },
        { label: "Normal (14px)", className: "text-sm" },
        { label: "Medium (16px)", className: "text-base" },
        { label: "Large (18px)", className: "text-lg" },
        { label: "XL (20px)", className: "text-xl" },
        { label: "2XL (24px)", className: "text-2xl" }
    ];

    return (
        <div className="space-y-8">
            {/* Font Information */}
            <div className="p-6 border rounded-lg bg-muted/50">
                <h2 className="text-xl font-bold mb-4">Font Configuration</h2>
                <div className="space-y-2 text-sm">
                    <div>
                        <strong>Font Stack:</strong>
                        <code className="block mt-1 p-2 bg-background rounded text-xs break-all">
                            {fontInfo}
                        </code>
                    </div>
                    <div>
                        <strong>Computed Font:</strong>
                        <code className="block mt-1 p-2 bg-background rounded text-xs">
                            {actualFont}
                        </code>
                    </div>
                    <div>
                        <strong>Document Language:</strong>
                        <code className="ml-2">{documentLang}</code>
                    </div>
                </div>
            </div>

            {/* Comprehensive Diacritical Mark Tests */}
            <div className="p-6 border rounded-lg">
                <h2 className="text-xl font-bold mb-4">Vietnamese Diacritical Mark Tests</h2>
                <div className="space-y-4">
                    {vietnameseTestCases.map((testCase, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                            <h3 className="font-semibold text-sm text-muted-foreground mb-1">
                                {testCase.category}
                            </h3>
                            <p className="text-base font-medium">
                                {testCase.text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Size Testing */}
            <div className="p-6 border rounded-lg">
                <h2 className="text-xl font-bold mb-4">Font Size Rendering Test</h2>
                <div className="space-y-3">
                    {textSizes.map((size, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground w-24 flex-shrink-0">
                                {size.label}
                            </span>
                            <p className={size.className}>
                                Tiếng Việt với dấu: àáảãạ ăằắẳẵặ âầấẩẫậ êềếểễệ ôồốổỗộ ơờớởỡợ ưừứửữự
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Monospace Font Test */}
            <div className="p-6 border rounded-lg">
                <h2 className="text-xl font-bold mb-4">Monospace Font Test</h2>
                <div className="space-y-2">
                    <code className="block p-3 bg-muted rounded font-mono text-sm">
                        {/* Vietnamese comments in code */}
                        const message = &quot;Xin chào thế giới!&quot;;
                        const special = &quot;àáảãạ ăằắẳẵặ âầấẩẫậ&quot;;
                    </code>
                    <pre className="p-3 bg-muted rounded font-mono text-sm">
                        {`function greetInVietnamese() {
  return "Chào mừng bạn đến với ứng dụng!";
}`}
                    </pre>
                </div>
            </div>
        </div>
    );
}