import { Container, Navbar } from "react-bootstrap";

export default function Layout({ children }) {
  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container fluid className="p-3">
          <Navbar.Brand>🚛 TruckDriver Route Planner</Navbar.Brand>
        </Container>
      </Navbar>
      <Container fluid className="p-3">{children}</Container>
    </>
  );
}