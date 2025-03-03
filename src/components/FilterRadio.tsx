import React from "react";
import styled from "styled-components";
import { Share } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface FilterRadioProps {
  value: "all" | "owned" | "shared";
  onChange: (value: "all" | "owned" | "shared") => void;
}

const FilterRadio: React.FC<FilterRadioProps> = ({ value, onChange }) => {
  const { darkMode } = useTheme();

  return (
    <StyledWrapper darkMode={darkMode}>
      <div className="radio-inputs">
        <label className="radio">
          <input
            type="radio"
            name="filter-mode"
            checked={value === "all"}
            onChange={() => onChange("all")}
          />
          <span className="name">All</span>
        </label>

        <label className="radio">
          <input
            type="radio"
            name="filter-mode"
            checked={value === "owned"}
            onChange={() => onChange("owned")}
          />
          <span className="name">My Places</span>
        </label>

        <label className="radio">
          <input
            type="radio"
            name="filter-mode"
            checked={value === "shared"}
            onChange={() => onChange("shared")}
          />
          <span className="name flex items-center gap-1">
            <Share size={14} /> Shared
          </span>
        </label>
      </div>
    </StyledWrapper>
  );
};

interface StyledWrapperProps {
  darkMode: boolean;
}

const StyledWrapper = styled.div<StyledWrapperProps>`
  display: flex;
  justify-content: center;

  .radio-inputs {
    position: relative;
    display: inline-flex; /* Change to inline-flex */
    flex-wrap: nowrap; /* Prevent wrapping */
    border-radius: 0.75rem;
    background-color: ${(props) => (props.darkMode ? "#1e293b" : "#eef2f7")};
    box-sizing: border-box;
    box-shadow: ${(props) =>
      props.darkMode
        ? "0 0 0px 1px rgba(255, 255, 255, 0.1)"
        : "0 0 0px 1px rgba(0, 0, 0, 0.06)"};
    padding: 0.25rem;
    width: auto; /* Auto width instead of fixed */
    font-size: 14px;
  }

  .radio-inputs .radio {
    flex: 1 1 auto;
    text-align: center;
  }

  .radio-inputs .radio input {
    display: none;
  }

  .radio-inputs .radio .name {
    display: flex;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    border: none;
    padding: 0.6rem 0.8rem; /* Slightly more padding */
    color: ${(props) =>
      props.darkMode ? "rgba(203, 213, 225, 0.8)" : "rgba(51, 65, 85, 0.8)"};
    transition: all 0.15s ease-in-out;
    font-weight: 500;
    white-space: nowrap; /* Prevent text wrapping */
  }

  .radio-inputs .radio input:checked + .name {
    background: ${(props) =>
      props.darkMode
        ? "linear-gradient(rgba(30, 58, 138, 0.5), rgba(23, 37, 84, 0.5))"
        : "linear-gradient(#e0f2fe, #bfdbfe)"};
    color: ${(props) => (props.darkMode ? "#60a5fa" : "#1d4ed8")};
    font-weight: 600;
  }

  /* Hover effect */
  .radio-inputs .radio:hover .name {
    background-color: ${(props) =>
      props.darkMode ? "rgba(51, 65, 85, 0.5)" : "rgba(255, 255, 255, 0.5)"};
  }

  /* Animation */
  .radio-inputs .radio input:checked + .name {
    position: relative;
    box-shadow: ${(props) =>
      props.darkMode
        ? "0 2px 8px rgba(0, 0, 0, 0.4)"
        : "0 2px 8px rgba(0, 0, 0, 0.1)"};
    animation: select 0.3s ease;
  }

  @keyframes select {
    0% {
      transform: scale(0.95);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Particles */
  .radio-inputs .radio input:checked + .name::before,
  .radio-inputs .radio input:checked + .name::after {
    content: "";
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: ${(props) => (props.darkMode ? "#60a5fa" : "#3b82f6")};
    opacity: 0;
    animation: particles 0.5s ease forwards;
  }

  .radio-inputs .radio input:checked + .name::before {
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
  }

  .radio-inputs .radio input:checked + .name::after {
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
  }

  @keyframes particles {
    0% {
      opacity: 0;
      transform: translateX(-50%) translateY(0);
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateX(-50%) translateY(var(--direction));
    }
  }

  .radio-inputs .radio input:checked + .name::before {
    --direction: -10px;
  }

  .radio-inputs .radio input:checked + .name::after {
    --direction: 10px;
  }
`;

export default FilterRadio;
