import { useState, useRef, useEffect } from 'react';
import { SUPPORT_FAQS } from '../utils';

interface SupportChatProps {
    playerName: string;
    onClose: () => void;
    soundEnabled: boolean;
    playSynthSound: (type: 'swap' | 'match' | 'bomb' | 'bolt' | 'win') => void;
}

interface ChatMessage {
    id: string;
    text: string;
    isBot: boolean;
    time: string;
}

export default function SupportChat({
    playerName,
    onClose,
    soundEnabled,
    playSynthSound
}: SupportChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welc1",
            text: `Hi ${playerName}! Welcome to Fruit Crush Customer Support. 🍬`,
            isBot: true,
            time: "Now"
        },
        {
            id: "welc2",
            text: "Need tips on Jelly, dragons, or extra boosters? Ask me anything or tap one of the FAQs below!",
            isBot: true,
            time: "Now"
        }
    ]);
    const [input, setInput] = useState<string>('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;
        playSynthSound('swap');

        // User Message
        const userMsg: ChatMessage = {
            id: `usr-${Date.now()}`,
            text: text,
            isBot: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Generate Bot reply with nice delays
        setTimeout(() => {
            let replyText = "That's a sweet question! Match elements next to blockers or clear levels to secure free gold stars!";
            const lower = text.toLowerCase();

            if (lower.includes('jelly') || lower.includes('clear')) {
                replyText = "Frosted Jellies are cleared by matching matching fruits over them! Focus your matching on jelly areas first.";
            } else if (lower.includes('dragon') || lower.includes('ingredient')) {
                replyText = "Swap the precious Gummi Dragons (🐉) side-ways so they slip to the ultimate bottom row (row 7) to collect them!";
            } else if (lower.includes('rapids') || lower.includes('water')) {
                replyText = "In Rainbow Rapids, swap and make fruit combinations next to the mud blockers (🧱) to unlock the flow and complete the goal.";
            } else if (lower.includes('free') || lower.includes('booster') || lower.includes('lollipop')) {
                replyText = "In-game manual Lollipop Hammers can crush any tile! Earn them on the fortune wheel, claims, or win streaks.";
            } else if (lower.includes('stuck') || lower.includes('hard')) {
                replyText = "Don't fret! Try clearing and shuffling using the 'MIX' button on your bottom panel, or pre-equip a Color Bomb booster before you launch the board!";
            } else if (lower.includes('level') || lower.includes('100')) {
                replyText = "We have 100 sweet, fully functional levels categorized in pages of 25! Complete each level to crack your historic stats.";
            }

            const botMsg: ChatMessage = {
                id: `bot-${Date.now()}`,
                text: replyText,
                isBot: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, botMsg]);
            playSynthSound('match');
        }, 850);
    };

    return (
        <div id="support-modal-overlay" className="absolute inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 rounded-[2.5rem]">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm p-5 rounded-[2rem] shadow-2xl border border-white/20 flex flex-col h-[78vh] max-h-[700px]">
                
                {/* Header widget */}
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-2 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <span className="text-3xl">🐼</span>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></span>
                        </div>
                        <div>
                            <span className="font-black text-sm text-gray-850 dark:text-zinc-150 block leading-tight">Gummy Support</span>
                            <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">● Online Consultant</span>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 flex items-center justify-center text-sm font-black active:scale-90"
                    >
                        ✕
                    </button>
                </div>

                {/* Simulated message log */}
                <div className="flex-grow overflow-y-auto space-y-3 p-2 bg-zinc-50 dark:bg-zinc-950 rounded-2xl mb-3 shrink-1 border border-zinc-150/40 dark:border-zinc-850">
                    {messages.map((m) => (
                        <div 
                            key={m.id}
                            className={`flex flex-col max-w-[85%] ${m.isBot ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                        >
                            <span className="text-[8px] text-gray-400 mb-0.5 px-1">{m.isBot ? "Chef Gummy Support" : playerName} ({m.time})</span>
                            <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed ${
                                m.isBot 
                                    ? 'bg-white dark:bg-zinc-850 text-gray-800 dark:text-zinc-200 rounded-tl-sm border border-zinc-100 dark:border-zinc-805' 
                                    : 'bg-pink-500 text-white rounded-tr-sm'
                            }`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Interactive FAQ Chips */}
                <div className="shrink-0 mb-3 pt-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
                        Suggested FAQs (Tap to ask):
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1.5 pr-2 select-none whitespace-nowrap scrollbar-thin">
                        {SUPPORT_FAQS.map((faq, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSendMessage(faq.q)}
                                className="px-3 py-1.5 bg-white dark:bg-zinc-850 text-gray-700 dark:text-zinc-300 rounded-full border border-zinc-200 dark:border-zinc-800 text-[9px] font-bold active:bg-zinc-100 hover:border-pink-300 transition-colors"
                            >
                                ❓ {faq.q}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input block */}
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
                    className="flex gap-2 shrink-0"
                >
                    <input
                        type="text"
                        placeholder="Type question here (e.g. 'Dragon', 'Jelly')..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-grow px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-850 outline-none text-xs font-bold text-gray-800 dark:text-zinc-100 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                    />
                    <button
                        type="submit"
                        className="bg-pink-500 hover:bg-pink-600 active:scale-95 text-white font-black text-xs px-4 rounded-xl shadow transition-all"
                    >
                        SEND
                    </button>
                </form>

            </div>
        </div>
    );
}
