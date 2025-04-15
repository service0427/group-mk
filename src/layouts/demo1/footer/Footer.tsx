import { Container } from '@/components/container';
import { generalSettings } from '@/config';

const Footer = () => {

  return (
    <footer className="footer">
      <Container>
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 py-5">
          <div className="flex order-2 md:order-1  gap-2 font-normal text-2sm">
            <span className="text-gray-500">2025 &copy;</span>
            <a
              href="#"
              className="text-gray-600 hover:text-primary"
            >
              여기에 대충 누군지 쓰세요.
            </a>
          </div>
          <nav className="flex order-1 md:order-2 gap-4 font-normal text-2sm text-gray-600">
            <a href={generalSettings.faqLink} className="hover:text-primary">
              FAQ
            </a>
            <a href={generalSettings.supportLink} className="hover:text-primary">
              Support
            </a>
          </nav>
        </div>
      </Container>
    </footer>
  );
};

export { Footer };
