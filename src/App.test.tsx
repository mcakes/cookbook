import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders app header with navigation", () => {
  render(<App />);
  expect(screen.getAllByText("Cookbook3").length).toBeGreaterThan(0);
  expect(screen.getByText("Browse")).toBeInTheDocument();
  expect(screen.getByText("Search")).toBeInTheDocument();
  expect(screen.getByText("Meal Planner")).toBeInTheDocument();
});
