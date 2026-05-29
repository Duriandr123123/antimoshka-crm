from datetime import date, timedelta

import models
import schemas
from database import Base, SessionLocal, engine


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            return

        admin = models.User(username="admin", password="admin123", role="admin", full_name="Администратор")
        manager = models.User(username="manager", password="manager123", role="manager", full_name="Менеджер")
        db.add_all([admin, manager])
        db.flush()

        clients_data = [
            ("Айгуль Н.", "+7 701 111 10 01", "Астана, Кабанбай батыра 12", "Instagram", "Нужны сетки в спальню"),
            ("Ерлан К.", "+7 702 222 20 02", "Астана, Туран 48", "Рекомендация", "Частный дом"),
            ("Марина С.", "+7 705 333 30 03", "Астана, Сыганак 18", "WhatsApp", "Срочный замер"),
            ("Данияр М.", "+7 707 444 40 04", "Астана, Абая 7", "Другое", "Балкон и кухня"),
            ("Ольга П.", "+7 708 555 50 05", "Астана, Мәңгілік Ел 32", "Instagram", "Интересует 2 в 1"),
            ("Руслан Т.", "+7 747 666 60 06", "Астана, Сарайшык 5", "Рекомендация", "После ремонта"),
            ("Наталья В.", "+7 777 777 70 07", "Астана, Кенесары 44", "WhatsApp", "Три окна"),
            ("Самат Ж.", "+7 701 888 80 08", "Астана, Бейбитшилик 21", "Instagram", "Нужна антимошка"),
            ("Ирина Л.", "+7 702 999 90 09", "Астана, Жансугурова 9", "Другое", "Офис"),
            ("Асель Р.", "+7 705 000 00 10", "Астана, Айнакол 66", "Рекомендация", "Детская комната"),
        ]

        clients = [models.Client(name=name, phone=phone, address=address, source=source, comment=comment) for name, phone, address, source, comment in clients_data]
        db.add_all(clients)
        db.flush()

        statuses = schemas.STATUSES
        net_types = schemas.NET_TYPES
        deals = []
        for index, client in enumerate(clients):
            deal = models.Deal(
                client_id=client.id,
                net_type=net_types[index % len(net_types)],
                windows_count=(index % 5) + 1,
                amount=18000 + index * 7500,
                status=statuses[index % len(statuses)],
                comment=f"Тестовая сделка #{index + 1}",
            )
            deals.append(deal)
            db.add(deal)
        db.flush()

        for index, deal in enumerate(deals):
            db.add(
                models.Task(
                    deal_id=deal.id,
                    manager_id=manager.id if index % 2 else admin.id,
                    measurement_date=date.today() + timedelta(days=index % 4),
                    installation_date=date.today() + timedelta(days=(index % 4) + 5),
                )
            )
            db.add(
                models.StatusHistory(
                    deal_id=deal.id,
                    old_status=None,
                    new_status=deal.status,
                    comment="Тестовые данные",
                )
            )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("Seed data loaded")
