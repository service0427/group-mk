import { Accordion, AccordionItem } from '@/components/accordion';

interface IFaqItem {
  title: string;
  text: string;
}
interface IFaqItems extends Array<IFaqItem> {}

const MiscFaq = () => {
  const items: IFaqItems = [
    {
      title: 'How is pricing determined for each plan ?',
      text: "Metronic embraces flexible licensing options that empower you to choose the perfect fit for your project's needs and budget. Understanding the factors influencing each plan's pricing helps you make an informed decision. Metronic embraces flexible licensing options that empower you to choose the perfect fit for your project's needs and budget. Understanding the factors influencing each plan's pricing helps you make an informed decision. Metronic embraces flexible licensing options that empower you to choose the perfect fit for your project's needs and budget. Understanding the factors influencing each plan's pricing helps you make an informed decision"
    },
    {
      title: 'What payment methods are accepted for subscriptions ?',
      text: "Metronic embraces flexible licensing options that empower you to choose the perfect fit for your project's needs and budget. Understanding the factors influencing each plan's pricing helps you make an informed decision"
    },
    {
      title: 'Are there any hidden fees in the pricing ?',
      text: "Metronic embraces flexible licensing options that empower you to choose the perfect fit for your project's needs and budget. Understanding the factors influencing each plan's pricing helps you make an informed decision"
    },
    {
      title: 'Is there a discount for annual subscriptions ?',
      text: "Metronic embraces flexible licensing options that empower you to choose the perfect fit for your project's needs and budget. Understanding the factors influencing each plan's pricing helps you make an informed decision"
    },
    {
      title: 'Do you offer refunds on subscription cancellations ?',
      text: "Metronic embraces flexible licensing options that empower you to choose the perfect fit for your project's needs and budget. Understanding the factors influencing each plan's pricing helps you make an informed decision"
    },
    {
      title: 'Can I add extra features to my current plan ?',
      text: "Metronic embraces flexible licensing options that empower you to choose the perfect fit for your project's needs and budget. Understanding the factors influencing each plan's pricing helps you make an informed decision"
    }
  ];

  const generateItems = () => {
    return (
      <Accordion allowMultiple={false}>
        {items.map((item, index) => (
          <AccordionItem key={index} title={item.title}>
            {item.text}
          </AccordionItem>
        ))}
      </Accordion>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">FAQ</h3>
      </div>
      <div className="card-body py-3">{generateItems()}</div>
    </div>
  );
};

export { MiscFaq, type IFaqItem, type IFaqItems };
