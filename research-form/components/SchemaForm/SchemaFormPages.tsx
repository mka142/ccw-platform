import React from "react";
import { FormSchema } from "@/lib/formSchema";
import FormPages, { FormResponseSchema } from "@/components/form/FormPages";
import { renderSchemaFormPage } from "./SchemaFormPage";
import { FormLocalSaverResetButton } from "../form/FormLocalSaver";

interface SchemaFormPagesProps {
  schema: FormSchema;
  onFinish?: (data: FormResponseSchema) => Promise<boolean> | boolean;
}

export const SchemaFormPages: React.FC<SchemaFormPagesProps> = ({
  schema,
  onFinish,
}) => {
  const [isFirstPage, setIsFirstPage] = React.useState(true);
  const [showDescription, setShowDescription] = React.useState(true);

  React.useEffect(() => {
    if (isFirstPage) {
      setShowDescription(true);
    }
  }, [isFirstPage]);

  const handlePageChange = (pageIndex: number) => {
    setIsFirstPage(pageIndex === 0);
  };

  const handleTransitionEnd = () => {
    if (!isFirstPage) {
      setShowDescription(false);
    }
  };

  return (
    <>
      <div>
        {isFirstPage && (
          <FormLocalSaverResetButton storageKey="schema-form-data" />
        )}
        <h1
          className="font-bold font-serif text-2xl"
          dangerouslySetInnerHTML={{ __html: schema.formTitle }}
        />
        {showDescription && (
          <div
            className={`transition-all duration-1500 ease-in-out overflow-hidden transform ${
              isFirstPage
                ? "opacity-100 max-h-40"
                : "opacity-0 max-h-0 pointer-events-none"
            }`}
            onTransitionEnd={handleTransitionEnd}
          >
            <span
              dangerouslySetInnerHTML={{ __html: schema.formDescription }}
            />
          </div>
        )}
        <div role="divider" className="my-4 border-t border-gray-300" />
      </div>
      <FormPages onFinish={onFinish} onPageChange={handlePageChange}>
        {schema.formPages.map((page, idx) => (
          <React.Fragment key={idx}>
            {renderSchemaFormPage(page, idx)}
          </React.Fragment>
        ))}

        <FormPages.Confirmation />
      </FormPages>
    </>
  );
};
