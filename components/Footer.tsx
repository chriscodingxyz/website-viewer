import React from "react";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-300 mt-8 py-4">
      <div className="container mx-auto px-4 flex flex-col items-center">
        <div className="flex space-x-4 mb-2">
          <a
            href="https://github.com/chriscodingxyz"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub className="text-gray-600 hover:text-gray-800" size={24} />
          </a>
          <a
            href="https://linkedin.com/in/wisniewskichris"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaLinkedin
              className="text-gray-600 hover:text-gray-800"
              size={24}
            />
          </a>
          <a
            href="https://twitter.com/chriscodingxyz"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaTwitter
              className="text-gray-600 hover:text-gray-800"
              size={24}
            />
          </a>
        </div>
        <p className="text-sm text-gray-600">
          © {currentYear + " "}
          <a
            href="https://chriswiz.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            chriscoding.xyz
          </a>{" "}
          - All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
