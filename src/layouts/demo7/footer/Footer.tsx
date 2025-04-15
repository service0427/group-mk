import { Container } from '@/components/container';
import { generalSettings } from '@/config';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 py-5">
          <div className="flex order-2 md:order-1  gap-2 font-normal text-2sm">
            <span className="text-gray-500">{currentYear} &copy;</span>
            <a
              href="https://keenthemes.com"
              target="_blank"
              className="text-gray-600 hover:text-primary"
            >
              Keenthemes Inc.
            </a>
          </div>
          <nav className="flex order-1 md:order-2 gap-4 font-normal text-2sm text-gray-600">
            <a href={generalSettings.docsLink} target="_blank" className="hover:text-primary">
              Docs
            </a>
            <a href={generalSettings.purchaseLink} target="_blank" className="hover:text-primary">
              Purchase
            </a>
            <a href={generalSettings.faqLink} target="_blank" className="hover:text-primary">
              FAQ
            </a>
            <a href="https://devs.keenthemes.com" target="_blank" className="hover:text-primary">
              Support
            </a>
            <a href={generalSettings.licenseLink} target="_blank" className="hover:text-primary">
              License
            </a>
          </nav>
        </div>
      </Container>
    </footer>
  );
};

export { Footer };
