import { useSelector } from "react-redux";
import Router from "next/router";
import dynamic from "next/dynamic";
import {
  Form,
  Row,
  Col,
  Container,
  Jumbotron,
  Button,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { InfoCircleFill, QuestionCircleFill } from "react-bootstrap-icons";
import { useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import Layout from "../../src/components/Layout";
import ResponseMessage from "../../src/components/ResponseMessage";
import { encrypt } from "../../src/helpers/helpers";
import { Choice, RocketMeetPoll } from "../../src/models/poll";
import withprivateAuth from "../../src/utils/privateAuth";
import { RootState } from "../../src/store/store";
import { createPoll } from "../../src/utils/api/server";

// typings aren't available for react-available-times :(

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AvailableTimes: any = dynamic(() => import("react-available-times"), {
  ssr: false,
});

const Create = (): JSX.Element => {
  const [pollTitle, setTitle] = useState<string>("");
  const [pollDescription, setDescription] = useState<string>("");
  const [pollChoices, setChoices] = useState<Choice[]>();
  const [disabled, setDisabled] = useState<boolean>(false);
  const loggedInUserEmailID = useSelector(
    (state: RootState) => state.authReducer.username
  );
  const token = useSelector((state: RootState) => state.authReducer.token);

  const [response, setResponse] = useState({
    status: false,
    type: "",
    msg: "",
  });

  const [tourRun, setTourRun] = useState<boolean>(false);

  // Run automatically for first time users
  if (typeof window !== "undefined") {
    if (localStorage.visited !== "true") {
      localStorage.setItem("visited", "true");
      setTourRun(true);
    }
  }

  const tourSteps: Step[] = [
    {
      disableBeacon: true,
      target: "#formPlainTextTitle",
      content: "Give your event the memorable title it deserves.",
    },
    {
      target: "#formPlainTextDescription",
      content:
        "Add a description to let your invitees know what this is all about.",
    },
    {
      target: ".rat-AvailableTimes_buttons",
      content:
        "Are you an early planner? Use these button to schedule in the future. (ps: Time travel powers not included)",
    },
    {
      target: ".rat-Slider_component",
      content:
        "Click and drag to create a time slot. You can create more than one. These will be the choices that are generated in the poll",
    },
    {
      target: ".create-poll-btn",
      content: "Click here when you're all done to get a sharable link",
    },
  ];

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { value } = e.target;
    setTitle(value);
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { value } = e.target;
    setDescription(value);
  };

  const onChoicesChange = (selections: { start: Date; end: Date }[]): void => {
    const newChoices: Choice[] = selections.map(
      (choice): Choice => ({
        start: choice.start.getTime(),
        end: choice.end.getTime(),
      })
    );
    setChoices(newChoices);
  };

  const areChoicesValid = (choices: Choice[] | undefined): boolean => {
    if (!choices) return false;
    if (choices.some((choice: Choice) => choice.start < Date.now()))
      return false;
    return true;
  };

  const handleSubmit = async (
    e: React.MouseEvent<HTMLInputElement>
  ): Promise<void> => {
    e.preventDefault();
    if (
      pollTitle &&
      pollChoices &&
      pollChoices.length > 1 &&
      areChoicesValid(pollChoices)
    ) {
      setDisabled(true);
      const encryptedEmailID = encrypt(loggedInUserEmailID);
      const poll: RocketMeetPoll = {
        title: pollTitle,
        description: pollDescription,
        encryptedEmailID,
        choices: pollChoices,
      };
      try {
        const createPollResponse = await createPoll({
          poll,
          token,
        });
        if (createPollResponse.statusCode === 201) {
          Router.push(`/poll/${createPollResponse.data._id}`);
        } else {
          setDisabled(false);
          setResponse({
            status: true,
            type: "error",
            msg: "Poll creation failed, please try again later.",
          });
        }
      } catch (err) {
        setDisabled(false);
        setResponse({
          status: true,
          type: "error",
          msg: "Poll creation failed, check your connection.",
        });
      }
    } else if (!pollTitle) {
      setResponse({
        status: true,
        type: "error",
        msg: "Please provide a title.",
      });
    } else if (!areChoicesValid(pollChoices)) {
      setResponse({
        status: true,
        type: "error",
        msg: "Chosen time slots must not be in the past.",
      });
    } else {
      setResponse({
        status: true,
        type: "error",
        msg: "Please select at least two time slots to choose from.",
      });
    }
  };

  const handleStartTour = (): void => {
    setTourRun(true);
  };

  const handleJoyrideCallback = (data: CallBackProps): void => {
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status) || type === "beacon") {
      setTourRun(false);
    }
  };

  return (
    <Layout>
      <Joyride
        callback={handleJoyrideCallback}
        steps={tourSteps}
        run={tourRun}
        continuous
        showSkipButton
        showProgress
        debug={process.env.NODE_ENV === "development"}
        spotlightClicks
        styles={{
          buttonClose: { visibility: "hidden" },
          options: {
            primaryColor: "#101010",
          },
        }}
      />
      <Container className="rm-poll-container" fluid>
        <Row className="jumbo-row">
          <div className="jumbo-col-black col-sm-4">
            <Jumbotron className="poll-create">
              <Form.Group as={Row} controlId="formPlainTextTitle">
                <Col>
                  <Form.Control
                    className="rm-form-text"
                    type="text"
                    placeholder="Enter the title *"
                    required
                    onChange={handleTitleChange}
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} controlId="formPlainTextDescription">
                <Col>
                  <Form.Control
                    className="rm-form-desc"
                    type="text"
                    placeholder="Enter the description"
                    onChange={handleDescriptionChange}
                  />
                </Col>
              </Form.Group>
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip id="timezone-info">
                    The times are displayed in your time zone. Participants will
                    see the times in their time zone.
                  </Tooltip>
                }
              >
                <InfoCircleFill className="timezone-info-icon" />
              </OverlayTrigger>
              <QuestionCircleFill
                className="tour-start-icon"
                onClick={handleStartTour}
              />
            </Jumbotron>
          </div>
          <div className="col-sm-8">
            <Jumbotron className="poll-timeslot-jumbo">
              <AvailableTimes
                weekStartsOn="monday"
                onChange={onChoicesChange}
                height="65vh"
              />
              <Button
                className="rm-primary-button create-poll-btn"
                onClick={handleSubmit}
                disabled={disabled}
              >
                {!disabled ? (
                  `Create Poll`
                ) : (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="rm-button-spinner"
                    />
                  </>
                )}
              </Button>
              <ResponseMessage
                response={response}
                onHide={(): void =>
                  setResponse({ status: false, type: "", msg: "" })
                }
              />
            </Jumbotron>
          </div>
        </Row>
      </Container>
    </Layout>
  );
};

export default withprivateAuth(Create);
