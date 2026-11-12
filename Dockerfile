FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/nonlinear-control .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/nonlinear-control /nonlinear-control
ENV PORT=8080
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/nonlinear-control"]
