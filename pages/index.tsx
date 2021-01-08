import { Container, Row, Col, Button } from "react-bootstrap";
import Layout from "../src/components/layout";

const Home = (): JSX.Element => {
  return (
    <Layout>
      <div className="hero">
        <Container fluid>
          <Row>
            <Col className="hero-quote">
              <h2>
                It shouldn’t take 30 emails to schedule a 30-minute meeting
              </h2>
              <h3>Launch polls, schedule smart</h3>
              <Button
                className="ctl-button"
                variant="outline-primary"
                size="lg"
                href="/poll/create"
              >
                Create a poll
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    </Layout>
  );
};

export default Home;