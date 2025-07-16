'use client';
import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

interface FormChangeCorruptedStateProps {
    isCorrupted: boolean;
    action: () => Promise<void>;
}


function Submit({ isCorrupted }: { isCorrupted: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button
            disabled={pending}
            type="submit"
            variant="ghost"
            className="text-yellow-700 dark:text-yellow-500 border border-yellow-400"
        >
            {pending ? "Przetwarzanie..." :
                isCorrupted ? "Przywróć" : "Wyklucz"}
        </Button>
    )
}

export default function FormChangeCorruptedState({ isCorrupted, action }: FormChangeCorruptedStateProps) {

    return (
        <div className="mb-6 p-4 border border-yellow-400  rounded">
            <h2 className="font-bold text-yellow-700 dark:text-yellow-500 mb-2">
                Ostrzeżenie
            </h2>
            <p className="mb-2 text-yellow-800 dark:text-yellow-600">
                Jeśli ta odpowiedź jest błędna lub nie powinna być liczona w
                podsumowaniu, możesz oznaczyć ją <b>wykluczyć</b>. Po oznaczeniu nie
                będzie uwzględniana w podsumowaniu.
            </p>
            <div className="flex">
                <form action={action}>
                    <Submit isCorrupted={isCorrupted} />
                </form>
                <div datatype="is corrupted info" className="flex items-center ml-4">
                    {isCorrupted ? (
                        <>
                            <span className="text-red-600 flex items-center gap-1">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 inline-block"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.53-10.47a.75.75 0 00-1.06-1.06L10 8.94 7.53 6.47a.75.75 0 10-1.06 1.06L8.94 10l-2.47 2.47a.75.75 0 101.06 1.06L10 11.06l2.47 2.47a.75.75 0 101.06-1.06L11.06 10l2.47-2.47z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Odpowiedź nie jest uwzględniana w podsumowaniu.
                            </span>
                        </>
                    ) : (
                        <span className="text-green-600 flex items-center gap-1">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 inline-block"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.78-9.28a.75.75 0 00-1.06-1.06L9 11.44l-1.72-1.72a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            Odpowiedź jest uwzględniana w podsumowaniu.
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}