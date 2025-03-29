import random
import time

class Player:
    def __init__(self, name, sect):
        self.name = name
        self.sect = sect  # 少林/武当
        self.health = 100
        self.energy = 50
        self.skills = self.init_skills()
        self.qi = 0  # 内力（武当专用）
        self.zen = 0  # 禅意（少林专用）

    def init_skills(self):
        if self.sect == "少林":
            return {"罗汉拳": 15, "少林棍法": 25, "易筋经（恢复）": -20}
        else:
            return {"太极推手": 10, "武当剑法": 20, "龟息功（恢复）": -15}

    def attack(self, skill_name, target):
        if self.energy <= 0:
            print("内力不足，无法出招！")
            return False
        
        damage = self.skills[skill_name]
        if damage > 0:  # 攻击技能
            target.health -= damage
            self.energy -= 10
            print(f"{self.name}使用【{skill_name}】造成{damage}点伤害！")
        else:  # 恢复技能
            self.health -= damage  # 负负得正
            self.energy += 5
            print(f"{self.name}运功【{skill_name}】，恢复{-damage}点生命！")
        return True

def battle(player, enemy):
    print(f"\n===== 战斗开始！{player.name}（{player.sect}）vs {enemy.name}（{enemy.sect}）=====")
    while player.health > 0 and enemy.health > 0:
        print(f"\n{player.name}: 生命{player.health} 内力{player.energy}")
        print(f"{enemy.name}: 生命{enemy.health} 内力{enemy.energy}")
        
        # 玩家回合
        print("\n请选择招式：")
        for i, skill in enumerate(player.skills.keys()):
            print(f"{i+1}. {skill}")
        choice = int(input("输入数字出招：")) - 1
        player.attack(list(player.skills.keys())[choice], enemy)
        if enemy.health <= 0:
            break

        # 敌人回合（随机出招）
        time.sleep(1)
        enemy_skill = random.choice(list(enemy.skills.keys()))
        enemy.attack(enemy_skill, player)

    # 胜负判定
    if player.health > 0:
        print(f"\n★ {player.name}获胜！{player.sect}武功天下无双！")
    else:
        print(f"\n※ 你败给了{enemy.name}……需多加修炼！")

# 主程序
print("===== 武林争锋：禅武 vs 太极 =====")
name = input("输入你的名字：")
sect = input("选择门派（1.少林 2.武当）：")
sect = "少林" if sect == "1" else "武当"

player = Player(name, sect)
enemy_sect = "武当" if sect == "少林" else "少林"
enemy = Player("掌门大师" if enemy_sect == "少林" else "清风道长", enemy_sect)

print(f"\n欢迎{player.name}加入{player.sect}！习得武功：{', '.join(player.skills.keys())}")
input("按回车开始终极对决……")
battle(player, enemy)