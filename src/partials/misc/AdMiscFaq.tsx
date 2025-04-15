import { Accordion, AccordionItem } from '@/components/accordion';

interface IAdFaqItem {
  title: string;
  text: string;
}
type IAdFaqItems = Array<IAdFaqItem>

const AdMiscFaq = () => {
  const items: IAdFaqItems = [
    {
      title: '자주 묻는 질문1',
      text: "자주 묻는 질문1 에 대한 답 입니다."
    },
    {
      title: '자주 묻는 질문2',
      text: "자주 묻는 질문2 에 대한 답 입니다."
    },
    {
      title: '자주 묻는 질문3',
      text: "자주 묻는 질문3 에 대한 답 입니다."
    },
    {
      title: '자주 묻는 질문4',
      text: "자주 묻는 질문4 에 대한 답 입니다."
    },
    {
      title: '자주 묻는 질문5',
      text: "자주 묻는 질문5 에 대한 답 입니다."
    },
    {
      title: '자주 묻는 질문6',
      text: "자주 묻는 질문6 에 대한 답 입니다."
    },
    {
      title: '자주 묻는 질문7',
      text: "자주 묻는 질문7 에 대한 답 입니다."
    },
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

export { AdMiscFaq, type IAdFaqItem, type IAdFaqItems };
