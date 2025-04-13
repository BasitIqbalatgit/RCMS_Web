import { ChevronRight, Sparkle } from "lucide-react";
import { AnimatedGradientText } from "../magicui/animated-gradient-text";
import { cn } from "@/lib/utils";
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "../ui/accordion";
import { } from "@radix-ui/react-accordion";




const faqsList = [
    {
        question: "How does the RCMS work?",
        answer: "RCMS uses advanced AI algorithms, including convolutional neural networks and image segmentation, to analyze uploaded or captured vehicle images. It detects and highlights car parts like rims, spoilers, and headlights, allowing users to overlay realistic modifications from a catalog, creating accurate previews of customized vehicles."
    },
    {
        question: "Is my data safe with RCMS?",
        answer: "Yes, we prioritize data security. All user data, including vehicle images and customization preferences, is encrypted both in transit and at rest. RCMS complies with regional data protection laws, such as GDPR and CCPA, ensuring your information is never shared without explicit consent."
    },
    {
        question: "What kind of images should I upload for the best results?",
        answer: "For optimal results, upload clear, high-quality images (JPG or PNG, up to 10MB) of your vehicle taken in good lighting. Ensure the car is fully visible, preferably from angles that show the parts you want to modify, like rims or spoilers, to help the AI accurately detect and segment them."
    },
    {
        question: "Can I use RCMS for my modification center’s services?",
        answer: "Absolutely! RCMS is designed for modification centers to provide customers with realistic previews of external car modifications. Operators can use it to showcase options like paint colors, rims, and spoilers, enhancing customer confidence and engagement."
    },
    {
        question: "How often is the RCMS AI model updated?",
        answer: "We continuously improve our AI models for part detection and modification rendering. Major updates, which may include support for additional car models or modification types, are released periodically, while minor optimizations occur regularly to enhance performance and accuracy."
    },
    {
        question: "What are the differences between admin and operator roles in RCMS?",
        answer: "Admins have full control, including managing operator accounts, updating the modification catalog, and viewing analytics. Operators can upload or capture vehicle images, apply modifications, and view sample customizations. Both roles require secure login, but admins have broader management capabilities."
    }
];

const Question = ({ question, answer }: { question: string, answer: string }) => {
    return <AccordionItem value={question}>
        <AccordionTrigger className="text-left">{question}</AccordionTrigger>
        <AccordionContent className="text-muted-foreground">{answer}</AccordionContent>
    </AccordionItem>
}

const Faqs = () => {
    return (
        <section id="faqs" className="w-full  py-32  flex flex-col items-center justify-center overflow-hidden">
            <div className="group bg-background backdrop-blur-0 relative mx-auto flex items-center justify-center rounded-full px-4 py-1.5 shadow-[inset_0_-8px_10px_#8fdfff1f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#8fdfff3f]">
                <span
                    className={cn(
                        "absolute inset-0 block h-full w-full animate-gradient rounded-[inherit] bg-gradient-to-r from-[#ffaa40]/50 via-[#9c40ff]/50 to-[#ffaa40]/50 bg-[length:300%_100%] p-[1px]"
                    )}
                    style={{
                        WebkitMask:
                            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "destination-out",
                        maskComposite: "exclude",
                    }}
                />
                <Sparkle className="w-4 h-4" strokeWidth={1.5} />
                <hr className="mx-2 h-4 w-px shrink-0 bg-gray-400" />
                <AnimatedGradientText className="text-sm font-medium  ">
                    FAQS
                </AnimatedGradientText>
                <ChevronRight className="ml-1 size-4 stroke-black-500 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </div>

            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 flex flex-col items-center">
                <div className="text-center">
                    <h2 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl xl:text-5xl font-pj">Frequently Asked Questions</h2>
                    <p className="text-lg mt-4 font-medium text-gray-600 font-pj">Here are some of the most frequently asked questions about our product</p>
                </div>



                <Accordion type="single" collapsible className="w-full md:w-4xl max-w-4xl mx-auto mt-16">
                    {
                        faqsList.map((faq) => {
                            return <Question key={faq.question} {...faq} />
                        })
                    }
                </Accordion>

            </div>

        </section>
    )
}

export default Faqs;


